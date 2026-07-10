import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import MapView from '@/components/event/map/MapView.vue';

const h = vi.hoisted(() => ({
  route: {
    path: '/map/search',
    name: 'map-search',
    query: {} as Record<string, unknown>,
    params: {} as Record<string, unknown>,
  },
  push: vi.fn(),
  replace: vi.fn(),
  result: null as unknown as { value: { events: unknown[]; eventsAggregate: { count: number } } },
  loading: null as unknown as { value: boolean },
  error: null as unknown as { value: null | { message: string } },
  onResultCb: null as null | ((value: { data?: { events: Array<{ id: string }> } }) => void),
  mdAndUp: null as unknown as { value: boolean },
}));

vi.mock('@headlessui/vue', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
}));

vi.mock('@/composables/useDisplay', () => ({
  useDisplay: () => ({ mdAndUp: h.mdAndUp }),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useRouter: () => ({ push: h.push, replace: h.replace }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: h.result,
    loading: h.loading,
    error: h.error,
    onResult: (cb: typeof h.onResultCb) => {
      h.onResultCb = cb;
    },
  }),
}));

h.result = ref({ events: [] as unknown[], eventsAggregate: { count: 0 } });
h.loading = ref(false);
h.error = ref(null);
h.mdAndUp = ref(true);

const EventFilterBar = {
  name: 'EventFilterBar',
  template: '<div class="event-filter-bar"><slot /></div>',
};
const TimeShortcuts = { name: 'TimeShortcuts', template: '<div class="time-shortcuts" />' };
const LoadingSpinner = { name: 'LoadingSpinner', template: '<div class="spinner" />' };
const ErrorBanner = { name: 'ErrorBanner', props: ['text'], template: '<div class="error">{{ text }}</div>' };
const EventPreview = { name: 'EventPreview', props: ['isOpen'], template: '<div class="preview" :data-open="isOpen" />' };
const PreviewContainer = {
  name: 'PreviewContainer',
  props: ['isOpen', 'header', 'topLayer'],
  template:
    '<div class="preview-container" :data-open="isOpen" :data-header="header"><slot /></div>',
};
const CloseButton = { name: 'CloseButton', emits: ['click'], template: '<button class="close-button" @click="$emit(\'click\')" />' };
const EventList = {
  name: 'EventList',
  props: ['events'],
  emits: ['filter-by-tag', 'filter-by-channel', 'highlight-event', 'open-preview', 'unhighlight'],
  template: '<div class="event-list" />',
};
const EventMap = {
  name: 'EventMap',
  props: ['events'],
  emits: ['highlight-event', 'open-preview', 'lock-colors', 'set-marker-data'],
  template: '<div class="event-map" />',
};

const stubs = {
  EventFilterBar,
  TimeShortcuts,
  LoadingSpinner,
  ErrorBanner,
  EventList,
  EventMap,
  EventPreview,
  PreviewContainer,
  CloseButton,
  'client-only': { template: '<div><slot /></div>' },
  ClientOnly: { template: '<div><slot /></div>' },
  NuxtPage: { template: '<div class="nuxt-page" />' },
};

const event = (id: string, title = `Event ${id}`) => ({
  id,
  title,
  locationName: 'Phoenix',
  location: { latitude: 33.4, longitude: -111.9 },
});

const mountView = () =>
  mount(MapView, {
    props: {},
    global: { stubs, mocks: { $route: h.route } },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { path: '/map/search', name: 'map-search', query: {}, params: {} };
  h.result.value = { events: [], eventsAggregate: { count: 0 } };
  h.loading.value = false;
  h.error.value = null;
  h.onResultCb = null;
  h.mdAndUp.value = true;
  vi.stubGlobal('CSS', { escape: (value: string) => value });
});

describe('MapView', () => {
  it('shows the loading spinner while events load', () => {
    h.loading.value = true;
    expect(mountView().findComponent(LoadingSpinner).exists()).toBe(true);
  });

  it('shows an error banner when the query errors', () => {
    h.error.value = { message: 'boom' };
    expect(mountView().findComponent(ErrorBanner).text()).toContain('boom');
  });

  it('routes to the online list from the map search header button', async () => {
    const wrapper = mountView();
    await wrapper.get('button').trigger('click');
    expect(h.push).toHaveBeenCalledWith({
      path: '/events/list/search',
      query: {},
    });
  });

  it('updates the route query when filtering by tag', async () => {
    h.result.value = { events: [event('1')], eventsAggregate: { count: 1 } };
    const wrapper = mountView();
    await wrapper.findComponent(EventList).vm.$emit('filter-by-tag', 'music');
    expect(h.replace).toHaveBeenCalled();
  });

  it('updates the route query when filtering by channel', async () => {
    h.result.value = { events: [event('1')], eventsAggregate: { count: 1 } };
    const wrapper = mountView();
    await wrapper.findComponent(EventList).vm.$emit('filter-by-channel', 'cats');
    expect(h.replace).toHaveBeenCalled();
  });

  it('pushes the first event into the preview route when the query callback returns events', async () => {
    mountView();
    h.onResultCb?.({ data: { events: [event('1')] } });
    await Promise.resolve();
    expect(h.push).toHaveBeenCalledWith({
      name: 'map-search-eventId',
      params: { eventId: '1' },
      hash: '#',
      query: {},
    });
  });

  it('opens the multiple-event preview when a map marker represents more than one event', async () => {
    h.result.value = { events: [event('1'), event('2')], eventsAggregate: { count: 2 } };
    const wrapper = mountView();

    await wrapper.findComponent(EventMap).vm.$emit('set-marker-data', {
      map: {},
      markerMap: {
        markers: {
          loc1: {
            marker: null,
            numberOfEvents: 2,
            events: {
              '1': event('1', 'First'),
              '2': event('2', 'Second'),
            },
          },
        },
        infowindow: {
          setContent: vi.fn(),
          open: vi.fn(),
          close: vi.fn(),
        },
      },
    });
    await wrapper.findComponent(EventMap).vm.$emit(
      'highlight-event',
      'loc1',
      '',
      event('1', 'First'),
      true,
      false
    );
    await wrapper.findComponent(EventMap).vm.$emit(
      'open-preview',
      event('1', 'First'),
      true
    );

    expect(
      wrapper
        .findAllComponents(PreviewContainer)
        .some((node) => node.attributes('data-open') === 'true')
    ).toBe(true);
  });

  it('renders the mobile map when the viewport is below md', () => {
    h.mdAndUp.value = false;
    h.result.value = { events: [event('1')], eventsAggregate: { count: 1 } };
    const wrapper = mountView();
    expect(wrapper.findAllComponents(EventMap)).toHaveLength(1);
  });
});

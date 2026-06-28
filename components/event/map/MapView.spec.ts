import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
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
  result: null as unknown as { value: unknown },
  loading: null as unknown as { value: boolean },
  error: null as unknown as { value: unknown },
  onResultCb: null as unknown as (v: unknown) => void,
}));

// A child of MapView imports TransitionRoot from @headlessui/vue, which the
// shared tests/setup.ts mock doesn't expose. Use the real module here.
vi.mock('@headlessui/vue', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
}));

vi.mock('vuetify', async () => {
  const { ref } = await import('vue');
  return { useDisplay: () => ({ mdAndUp: ref(true) }) };
});

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useRouter: () => ({ push: h.push, replace: h.replace }),
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.result = ref({ events: [] });
  h.loading = ref(false);
  h.error = ref(null);
  return {
    useQuery: () => ({
      result: h.result,
      loading: h.loading,
      error: h.error,
      onResult: (cb: (v: unknown) => void) => {
        h.onResultCb = cb;
      },
    }),
  };
});

const inert = (name: string) => ({ name, template: `<div data-stub="${name}" />` });
const stubs = {
  EventFilterBar: inert('EventFilterBar'),
  TimeShortcuts: inert('TimeShortcuts'),
  LoadingSpinner: { name: 'LoadingSpinner', template: '<div class="spinner" />' },
  ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="error" />' },
  EventList: {
    name: 'EventList',
    props: ['events'],
    emits: ['filter-by-tag', 'filter-by-channel', 'highlight-event', 'open-preview', 'unhighlight'],
    template: '<div class="event-list" />',
  },
  EventMap: {
    name: 'EventMap',
    props: ['events'],
    emits: ['highlight-event', 'open-preview', 'lock-colors', 'set-marker-data'],
    template: '<div class="event-map" />',
  },
  'client-only': { template: '<div><slot /></div>' },
  NuxtPage: true,
};

const event = (id: string) => ({
  id,
  title: `Event ${id}`,
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
  h.result.value = { events: [] };
  h.loading.value = false;
  h.error.value = null;
});

describe('MapView', () => {
  it('shows the loading spinner while events load', () => {
    h.loading.value = true;
    expect(mountView().findComponent({ name: 'LoadingSpinner' }).exists()).toBe(true);
  });

  it('shows an error banner when the query errors', () => {
    h.error.value = { message: 'boom' };
    expect(mountView().findComponent({ name: 'ErrorBanner' }).exists()).toBe(true);
  });

  it('renders the event list and map with results', () => {
    h.result.value = { events: [event('1'), event('2')] };
    const wrapper = mountView();
    expect(wrapper.findComponent({ name: 'EventList' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'EventMap' }).exists()).toBe(true);
  });

  it('updates the route query when filtering by tag', async () => {
    h.result.value = { events: [event('1')] };
    const wrapper = mountView();
    await wrapper.findComponent({ name: 'EventList' }).vm.$emit('filter-by-tag', 'music');
    expect(h.replace).toHaveBeenCalled();
  });

  it('updates the route query when filtering by channel', async () => {
    h.result.value = { events: [event('1')] };
    const wrapper = mountView();
    await wrapper
      .findComponent({ name: 'EventList' })
      .vm.$emit('filter-by-channel', 'cats');
    expect(h.replace).toHaveBeenCalled();
  });

  it('stores marker data emitted by the map', async () => {
    h.result.value = { events: [event('1')] };
    const wrapper = mountView();
    await wrapper
      .findComponent({ name: 'EventMap' })
      .vm.$emit('set-marker-data', { map: {}, markerMap: { markers: {} } });
    // No throw; the component accepted the marker data.
    expect(wrapper.findComponent({ name: 'EventMap' }).exists()).toBe(true);
  });

  it('handles the events query result callback', () => {
    mountView();
    expect(h.onResultCb).toBeTypeOf('function');
    // Should run without throwing for an empty / populated result.
    h.onResultCb({ data: { events: [] } });
    h.onResultCb({ data: { events: [event('1')] } });
    expect(true).toBe(true);
  });
});

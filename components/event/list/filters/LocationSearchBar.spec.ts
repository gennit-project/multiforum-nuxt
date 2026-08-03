import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';

import LocationSearchBar from '@/components/event/list/filters/LocationSearchBar.vue';

const h = vi.hoisted(() => ({
  get: vi.fn(),
  capability: null as unknown as { value: unknown },
  available: null as unknown as { value: boolean },
  loading: null as unknown as { value: boolean },
  error: null as unknown as { value: unknown },
}));

vi.mock('axios', () => ({
  default: { get: (...a: unknown[]) => h.get(...a) },
}));
vi.mock('@/composables/useInstanceSetupStatus', () => ({
  useInstanceCapability: () => ({
    capability: h.capability,
    available: h.available,
    loading: h.loading,
    error: h.error,
  }),
}));

const result = {
  formatted: 'Paris, France',
  geometry: { lat: 48.8, lng: 2.3 },
};

const mountBar = (props: Record<string, unknown> = {}, slot = '') =>
  mount(LocationSearchBar, {
    props,
    slots: { default: slot },
    global: {
      stubs: {
        ClientOnly: { template: '<div><slot /></div>' },
        LocationIcon: true,
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.get = vi.fn(() => Promise.resolve({ data: { results: [result] } }));
  h.capability = ref({
    configured: true,
    enabled: true,
    requiredEnvVarsMissing: [],
    setupUrl: '/admin/setup#geocoding',
    docsPath: '/roles/admins/map-setup',
  });
  h.available = ref(true);
  h.loading = ref(false);
  h.error = ref(null);
});

describe('LocationSearchBar rendering', () => {
  it('shows the placeholder', () => {
    const wrapper = mountBar({ searchPlaceholder: 'Where?' });

    expect(wrapper.find('input').attributes('placeholder')).toBe('Where?');
  });

  it('uses the initial value', () => {
    const wrapper = mountBar({ initialValue: 'Berlin' });

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe(
      'Berlin'
    );
  });

  it('renders the default slot', () => {
    const wrapper = mountBar({}, '<button class="my-btn" />');

    expect(wrapper.find('.my-btn').exists()).toBe(true);
  });

  it('disables location search when geocoding is not configured', () => {
    h.available = ref(false);
    h.capability = ref({
      configured: false,
      enabled: false,
      requiredEnvVarsMissing: ['VITE_OPEN_CAGE_API_KEY'],
      setupUrl: '/admin/setup#geocoding',
      docsPath: '/roles/admins/map-setup',
    });

    const wrapper = mountBar();

    expect(wrapper.get('input').attributes('disabled')).toBeDefined();
  });

  it('shows a setup link when geocoding is not configured', () => {
    h.available = ref(false);
    h.capability = ref({
      configured: false,
      enabled: false,
      requiredEnvVarsMissing: ['VITE_OPEN_CAGE_API_KEY'],
      setupUrl: '/admin/setup#geocoding',
      docsPath: '/roles/admins/map-setup',
    });

    const wrapper = mountBar();

    expect(wrapper.get('a').attributes('href')).toBe('/admin/setup#geocoding');
  });
});

describe('LocationSearchBar search', () => {
  it('searches when the query is long enough', async () => {
    const wrapper = mountBar();

    await wrapper.find('input').setValue('Paris');
    await wrapper.find('input').trigger('input');
    await flushPromises();

    expect(h.get).toHaveBeenCalled();
  });

  it('does not search for a short query', async () => {
    const wrapper = mountBar();

    await wrapper.find('input').setValue('Pa');
    await wrapper.find('input').trigger('input');
    await flushPromises();

    expect(h.get).not.toHaveBeenCalled();
  });

  it('does not call OpenCage when geocoding is unavailable', async () => {
    h.available = ref(false);
    h.capability = ref({ configured: false, enabled: false });
    const wrapper = mountBar();

    await wrapper.find('input').trigger('input');

    expect(h.get).not.toHaveBeenCalled();
  });

  it('renders the search results', async () => {
    const wrapper = mountBar();
    await wrapper.find('input').setValue('Paris');
    await wrapper.find('input').trigger('input');
    await flushPromises();

    expect(wrapper.find('li').text()).toBe('Paris, France');
  });
});

describe('LocationSearchBar selection', () => {
  it('emits the selected location', async () => {
    const wrapper = mountBar();
    await wrapper.find('input').setValue('Paris');
    await wrapper.find('input').trigger('input');
    await flushPromises();

    await wrapper.find('li').trigger('click');

    expect(wrapper.emitted('updateLocationInput')?.[0]?.[0]).toEqual({
      formatted_address: 'Paris, France',
      name: 'Paris',
      lat: 48.8,
      lng: 2.3,
    });
  });

  it('clears the results after selecting', async () => {
    const wrapper = mountBar();
    await wrapper.find('input').setValue('Paris');
    await wrapper.find('input').trigger('input');
    await flushPromises();

    await wrapper.find('li').trigger('click');

    expect(wrapper.find('li').exists()).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import LocationSearchBar from '@/components/event/list/filters/LocationSearchBar.vue';

const h = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('axios', () => ({ default: { get: (...a: unknown[]) => h.get(...a) } }));

const result = { formatted: 'Paris, France', geometry: { lat: 48.8, lng: 2.3 } };

const mountBar = (props: Record<string, unknown> = {}, slot = '') =>
  mount(LocationSearchBar, {
    props,
    slots: { default: slot },
    global: { stubs: { ClientOnly: { template: '<div><slot /></div>' }, LocationIcon: true } },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.get = vi.fn(() => Promise.resolve({ data: { results: [result] } }));
});

describe('LocationSearchBar rendering', () => {
  it('shows the placeholder', () => {
    const wrapper = mountBar({ searchPlaceholder: 'Where?' });

    expect(wrapper.find('input').attributes('placeholder')).toBe('Where?');
  });

  it('uses the initial value', () => {
    const wrapper = mountBar({ initialValue: 'Berlin' });

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Berlin');
  });

  it('renders the default slot', () => {
    const wrapper = mountBar({}, '<button class="my-btn" />');

    expect(wrapper.find('.my-btn').exists()).toBe(true);
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

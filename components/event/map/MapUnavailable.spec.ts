import { describe, expect, it } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import MapUnavailable from './MapUnavailable.vue';

describe('MapUnavailable', () => {
  it('links operators to the backend-provided setup location', () => {
    const wrapper = mountWithDefaults(MapUnavailable, {
      props: { setupUrl: '/admin/setup#custom-map' },
    });

    expect(wrapper.get('a').attributes('href')).toBe('/admin/setup#custom-map');
  });

  it('offers a list view when maps are not configured', () => {
    const wrapper = mountWithDefaults(MapUnavailable);

    expect(wrapper.text()).toContain('Browse events as a list');
  });

  it('distinguishes an unavailable status query from missing configuration', () => {
    const wrapper = mountWithDefaults(MapUnavailable, {
      props: { statusUnavailable: true },
    });

    expect(wrapper.text()).toContain('Map availability could not be checked');
  });
});

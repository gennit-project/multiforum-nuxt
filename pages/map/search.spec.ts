import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import MapSearchPage from './search.vue';
import MapView from '@/components/event/map/MapView.vue';

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

describe('map search page', () => {
  it('renders the map view', () => {
    const wrapper = shallowMount(MapSearchPage, {
      global: { stubs: { NuxtLayout: NuxtLayoutStub } },
    });
    expect(wrapper.findComponent(MapView).exists()).toBe(true);
  });
});

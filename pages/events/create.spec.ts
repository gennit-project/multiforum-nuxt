import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import CreateEventPage from './create.vue';
import CreateEvent from '@/components/event/form/CreateEvent.vue';

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

describe('sitewide create event page', () => {
  it('renders the create event form', () => {
    const wrapper = shallowMount(CreateEventPage, {
      global: { stubs: { NuxtLayout: NuxtLayoutStub } },
    });
    expect(wrapper.findComponent(CreateEvent).exists()).toBe(true);
  });
});

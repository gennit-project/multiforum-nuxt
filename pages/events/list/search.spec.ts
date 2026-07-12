import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

const useHead = vi.fn();

vi.mock('nuxt/app', () => ({
  useHead,
}));

const EventListViewStub = defineComponent({
  name: 'EventListView',
  template: '<div class="event-list-view-stub" />',
});

vi.mock('@/components/event/list/EventListView.vue', () => ({
  default: EventListViewStub,
}));

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

describe('online events list search page', () => {
  it('sets the page title to "Online Events"', async () => {
    const Page = (await import('./search.vue')).default;
    shallowMount(Page, {
      global: { stubs: { NuxtLayout: NuxtLayoutStub } },
    });
    expect(useHead).toHaveBeenCalledWith({ title: 'Online Events' });
  });
});

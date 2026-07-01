import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import DiscussionsIndexPage from './index.vue';

const SearchDiscussionsStub = defineComponent({
  name: 'SearchDiscussions',
  props: {
    isForumScoped: {
      type: Boolean,
      required: true,
    },
  },
  template: '<div data-testid="search-discussions-stub" />',
});

vi.mock('@/components/discussion/list/SearchDiscussions.vue', () => ({
  default: SearchDiscussionsStub,
}));

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

describe('sitewide discussions index page', () => {
  it('renders the server fallback while the client-only discussion search is unavailable', async () => {
    const wrapper = mount(DiscussionsIndexPage, {
      global: {
        stubs: {
          NuxtLayout: NuxtLayoutStub,
          ClientOnly: { template: '<div><slot /><slot name="fallback" /></div>' },
        },
      },
    });
    await flushPromises();

    expect(wrapper.findComponent(SearchDiscussionsStub).exists()).toBe(false);
    expect(wrapper.findAll('.h-24')).toHaveLength(3);
    expect(wrapper.find('.h-10').exists()).toBe(true);
  });
});

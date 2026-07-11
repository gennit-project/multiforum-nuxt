import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import DiscussionsIndexPage from './index.vue';

vi.mock('@/components/discussion/list/SearchDiscussions.vue', () => ({
  default: defineComponent({
    name: 'SearchDiscussions',
    props: {
      isForumScoped: {
        type: Boolean,
        required: true,
      },
    },
    template: '<div data-testid="search-discussions-stub" />',
  }),
}));

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

describe('sitewide discussions index page', () => {
  it('renders the discussion search list on the server route', async () => {
    const wrapper = mount(DiscussionsIndexPage, {
      global: {
        stubs: {
          NuxtLayout: NuxtLayoutStub,
        },
      },
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="search-discussions-stub"]').exists()).toBe(true);
  });
});

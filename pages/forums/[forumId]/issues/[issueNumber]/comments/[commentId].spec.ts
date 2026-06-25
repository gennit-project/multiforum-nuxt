import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import ActivityFeedListItem from '@/components/mod/ActivityFeedListItem.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { commentId: 'comment-1' } }),
}));

const PermalinkedStub = defineComponent({
  name: 'PermalinkedActivityFeedItem',
  props: ['commentId'],
  setup(_props, { slots }) {
    return () =>
      h('div', slots['moderation-action']?.({ moderationAction: { id: 'm1' } }));
  },
});

describe('issue comment permalink page', () => {
  it('passes the route comment id to the permalinked feed item', async () => {
    const Page = (await import('./[commentId].vue')).default;
    const wrapper = shallowMount(Page, {
      global: { stubs: { PermalinkedActivityFeedItem: PermalinkedStub } },
    });
    expect(
      wrapper.findComponent(PermalinkedStub).props('commentId')
    ).toBe('comment-1');
  });

  it('renders the activity feed item from the slot', async () => {
    const Page = (await import('./[commentId].vue')).default;
    const wrapper = shallowMount(Page, {
      global: { stubs: { PermalinkedActivityFeedItem: PermalinkedStub } },
    });
    expect(wrapper.findComponent(ActivityFeedListItem).exists()).toBe(true);
  });
});

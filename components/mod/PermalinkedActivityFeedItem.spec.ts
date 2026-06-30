import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import PermalinkedActivityFeedItem from '@/components/mod/PermalinkedActivityFeedItem.vue';

const h = vi.hoisted(() => ({
  result: null as unknown as { value: any },
  error: null as unknown as { value: any },
  loading: null as unknown as { value: boolean },
}));

h.result = ref(null);
h.error = ref(null);
h.loading = ref(false);

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { commentId: 'c1' } }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: h.result,
    error: h.error,
    loading: h.loading,
  }),
}));

vi.mock('@/graphQLData/comment/queries', () => ({
  GET_ACTIVITY_FEED_COMMENT: 'GET_ACTIVITY_FEED_COMMENT',
}));

const mountItem = () =>
  mount(PermalinkedActivityFeedItem, {
    slots: {
      'moderation-action': '<div class="slot-rendered">Action</div>',
    },
    global: {
      stubs: {
        ErrorBanner: {
          name: 'ErrorBanner',
          props: ['text'],
          template: '<div class="error">{{ text }}</div>',
        },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.result.value = null;
  h.error.value = null;
  h.loading.value = false;
});

describe('PermalinkedActivityFeedItem', () => {
  it('shows the loading state while the query is in flight', () => {
    h.loading.value = true;
    expect(mountItem().text()).toContain('Loading...');
  });

  it('shows the query error banner', () => {
    h.error.value = { message: 'boom' };
    expect(mountItem().text()).toContain('boom');
  });

  it('renders the moderation-action slot when a moderation action is present', () => {
    h.result.value = {
      comments: [{ ModerationAction: { id: 'a1', __typename: 'ModerationAction' } }],
    };

    const wrapper = mountItem();
    expect(wrapper.find('.slot-rendered').exists()).toBe(true);
  });

  it('shows the not-found state when the comment has no moderation action', () => {
    h.result.value = {
      comments: [{ ModerationAction: null }],
    };

    expect(mountItem().text()).toContain('Mod action not found');
  });
});

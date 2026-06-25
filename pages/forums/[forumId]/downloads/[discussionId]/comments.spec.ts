import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import DiscussionCommentsWrapper from '@/components/discussion/detail/DiscussionCommentsWrapper.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats', discussionId: 'd1' },
    query: {},
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    result: ref(null),
    loading: ref(false),
    error: ref(null),
    fetchMore: vi.fn(),
    refetch: vi.fn(),
    onResult: vi.fn(),
  })),
  useMutation: () => ({
    mutate: vi.fn(),
    loading: ref(false),
    error: ref(null),
    onDone: vi.fn(),
    onError: vi.fn(),
  }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ref('mod-1'),
  useUsername: () => ref('alice'),
}));

describe('download comments page', () => {
  it('renders the comments wrapper for the download', async () => {
    const Page = (await import('./comments.vue')).default;
    const wrapper = shallowMount(Page, {
      props: {
        discussion: {
          id: 'd1',
          title: 'A download',
          DiscussionChannels: [{ channelUniqueName: 'cats' }],
        },
      },
    });
    expect(wrapper.findComponent(DiscussionCommentsWrapper).exists()).toBe(true);
  });
});

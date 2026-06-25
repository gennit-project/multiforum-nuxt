import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import CommentHeader from '@/components/comments/CommentHeader.vue';
import PageNotFound from '@/components/PageNotFound.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats', discussionId: 'd1', commentId: 'c1' },
    query: {},
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
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
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (comment: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ comments: comment ? [comment] : [] }),
    error: ref(null),
    loading: ref(false),
    fetchMore: vi.fn(),
    onResult: vi.fn(),
  });
  const Page = (await import('./[commentId].vue')).default;
  return shallowMount(Page);
};

describe('comment feedback page', () => {
  it('renders the comment header when the comment loads', async () => {
    const wrapper = await mountWith({
      id: 'c1',
      text: 'Original comment',
      FeedbackComments: [],
      FeedbackCommentsAggregate: { count: 0 },
    });
    expect(wrapper.findComponent(CommentHeader).exists()).toBe(true);
  });

  it('shows the not-found page when the comment is missing', async () => {
    const wrapper = await mountWith(null);
    expect(wrapper.findComponent(PageNotFound).exists()).toBe(true);
  });
});

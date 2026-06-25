import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import Comment from '@/components/comments/Comment.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { username: 'alice' }, query: {} }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/composables/useSelectedChannelsFromQuery', () => ({
  useSelectedChannelsFromQuery: () => ({
    selectedChannels: ref([]),
    hasSelectedChannels: ref(false),
  }),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (comments: unknown[]) => {
  mockedUseQuery.mockReturnValue({
    result: ref({
      users: [{ Comments: comments, CommentsAggregate: { count: comments.length } }],
    }),
    loading: ref(false),
    error: ref(null),
    fetchMore: vi.fn(),
  });
  const Page = (await import('./comments.vue')).default;
  return shallowMount(Page);
};

describe('user comments page', () => {
  it('shows the empty message when the user has no comments', async () => {
    const wrapper = await mountWith([]);
    expect(wrapper.text()).toContain('No comments yet');
  });

  it('renders a Comment for each non-archived comment', async () => {
    const wrapper = await mountWith([
      { id: 'c1', archived: false, ParentComment: null, Event: {}, DiscussionChannel: {} },
      { id: 'c2', archived: false, ParentComment: null, Event: {}, DiscussionChannel: {} },
    ]);
    expect(wrapper.findAllComponents(Comment)).toHaveLength(2);
  });
});

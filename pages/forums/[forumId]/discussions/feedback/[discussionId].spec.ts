import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import FeedbackSection from '@/components/comments/FeedbackSection.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    name: 'forums-forumId-discussions-feedback-discussionId',
    params: { forumId: 'cats', discussionId: 'd1', commentId: '', feedbackId: '' },
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
  }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ref('mod-1'),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

describe('discussion feedback page', () => {
  it('renders the feedback section when the discussion loads', async () => {
    mockedUseQuery
      .mockReturnValueOnce({
        result: ref({
          discussions: [
            {
              id: 'd1',
              title: 'Hello',
              body: 'Body',
              DownloadableFiles: [],
              Album: { Images: [] },
              FeedbackComments: [],
              FeedbackCommentsAggregate: { count: 0 },
              Author: { username: 'alice' },
            },
          ],
        }),
        error: ref(null),
        loading: ref(false),
        fetchMore: vi.fn(),
      })
      .mockReturnValueOnce({
        result: ref({ comments: [] }),
        error: ref(null),
        loading: ref(false),
      });
    const Page = (await import('./[discussionId].vue')).default;
    const wrapper = shallowMount(Page);
    expect(wrapper.findComponent(FeedbackSection).exists()).toBe(true);
  });
});

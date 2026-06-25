import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import RevisionDiffContent from '@/components/revision/RevisionDiffContent.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats', slug: 'intro', revisionId: 'most-recent-edit' },
  }),
  useRouter: () => ({ push: vi.fn() }),
  useHead: vi.fn(),
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

vi.mock('@/composables/useModerationOutcomeUI', () => ({
  useModerationOutcomeUI: () => ({
    showReportModal: ref(false),
    showSuccessfullyReported: ref(false),
    openReportModal: vi.fn(),
    closeReportModal: vi.fn(),
    handleReportedSuccessfully: vi.fn(),
    dismissReportedNotification: vi.fn(),
  }),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (wikiPage: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ wikiPages: [wikiPage] }),
    loading: ref(false),
    error: ref(null),
  });
  const Page = (await import('./[revisionId].vue')).default;
  return shallowMount(Page);
};

describe('wiki revision diff page', () => {
  it('renders the diff for the selected revision', async () => {
    const wrapper = await mountWith({
      body: 'current body',
      updatedAt: '2024-03-01',
      createdAt: '2024-01-01',
      VersionAuthor: { username: 'carol' },
      PastVersions: [
        { id: 'p1', body: 'older body', createdAt: '2024-02-01' },
      ],
    });
    expect(wrapper.findComponent(RevisionDiffContent).exists()).toBe(true);
  });
});

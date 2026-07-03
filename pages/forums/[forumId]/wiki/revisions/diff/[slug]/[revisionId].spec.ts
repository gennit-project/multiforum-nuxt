import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import RevisionDiffContent from '@/components/revision/RevisionDiffContent.vue';

const routeState = vi.hoisted(() => ({
  revisionId: 'most-recent-edit',
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats', slug: 'intro', revisionId: routeState.revisionId },
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
    routeState.revisionId = 'most-recent-edit';
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

  it('renders an empty-to-first-version diff for selected historical revisions', async () => {
    routeState.revisionId = 'selected-v1';
    const wrapper = await mountWith({
      body: 'current body',
      updatedAt: '2024-03-01',
      createdAt: '2024-01-01',
      VersionAuthor: { username: 'carol' },
      PastVersions: [
        { id: 'v2', body: 'second body', createdAt: '2024-02-01', Author: { username: 'bob' } },
        { id: 'v1', body: 'first body', createdAt: '2024-01-15', Author: { username: 'alice' } },
      ],
    });

    const diff = wrapper.findComponent(RevisionDiffContent);
    expect(diff.props('oldVersion')).toMatchObject({
      id: '__initial__',
      body: '',
    });
    expect(diff.props('newVersion')).toMatchObject({
      id: 'v1',
      body: 'first body',
    });
  });

  it('resolves selected current revisions even when there are no past versions', async () => {
    routeState.revisionId = 'selected-current';
    const wrapper = await mountWith({
      body: 'first body',
      updatedAt: '2024-03-01',
      createdAt: '2024-03-01',
      VersionAuthor: { username: 'alice' },
      PastVersions: [],
    });

    const diff = wrapper.findComponent(RevisionDiffContent);
    expect(diff.exists()).toBe(true);
    expect(diff.props('oldVersion')).toMatchObject({
      id: '__initial__',
      body: '',
    });
    expect(diff.props('newVersion')).toMatchObject({
      id: 'current',
      body: 'first body',
    });
  });
});

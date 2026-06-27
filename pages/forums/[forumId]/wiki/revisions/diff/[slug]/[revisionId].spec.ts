import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import RevisionDiffContent from '@/components/revision/RevisionDiffContent.vue';

// Controllable redaction-permission stub so we can assert the redact action is
// gated without wiring real permission queries.
const redaction = vi.hoisted(() => ({ canRedact: true }));
vi.mock('@/composables/useWikiRedactionPermission', async () => {
  const { computed } = await import('vue');
  return {
    useWikiRedactionPermission: () => ({
      canRedact: computed(() => redaction.canRedact),
    }),
  };
});

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

const buildWikiPage = () => ({
  body: 'current body',
  updatedAt: '2024-03-01',
  createdAt: '2024-01-01',
  VersionAuthor: { username: 'carol' },
  PastVersions: [
    { id: 'p1', body: 'older body', createdAt: '2024-02-01' },
  ],
});

const findRedactButton = (wrapper: Awaited<ReturnType<typeof mountWith>>) =>
  wrapper.findAll('button').find((b) => b.text().includes('Redact Revision'));

describe('wiki revision diff page', () => {
  beforeEach(() => {
    redaction.canRedact = true;
  });

  it('renders the diff for the selected revision', async () => {
    const wrapper = await mountWith(buildWikiPage());
    expect(wrapper.findComponent(RevisionDiffContent).exists()).toBe(true);
  });

  it('shows the redact action when the user is authorized', async () => {
    redaction.canRedact = true;
    const wrapper = await mountWith(buildWikiPage());
    expect(findRedactButton(wrapper)).toBeTruthy();
  });

  it('hides the redact action when the user is not authorized', async () => {
    redaction.canRedact = false;
    const wrapper = await mountWith(buildWikiPage());
    expect(findRedactButton(wrapper)).toBeUndefined();
  });
});

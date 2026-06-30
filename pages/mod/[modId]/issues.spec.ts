import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import ModIssueListItem from '@/components/mod/ModIssueListItem.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { modId: 'coolmod' } }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (options: {
  authoredIssues: unknown[];
  modError?: unknown;
  issueError?: unknown;
  issueLoading?: boolean;
  fetchMore?: ReturnType<typeof vi.fn>;
}) => {
  const fetchMore = options.fetchMore ?? vi.fn();
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({
        moderationProfiles: [
          { AuthoredIssuesAggregate: { count: options.authoredIssues.length } },
        ],
      }),
      error: ref(options.modError ?? null),
    })
    .mockReturnValueOnce({
      result: ref({
        moderationProfiles: [{ AuthoredIssues: options.authoredIssues }],
      }),
      loading: ref(options.issueLoading ?? false),
      error: ref(options.issueError ?? null),
      fetchMore,
    });
  const Page = (await import('./issues.vue')).default;
  return {
    wrapper: shallowMount(Page, {
      global: {
        stubs: {
          ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="error">{{ text }}</div>' },
          LoadMore: { name: 'LoadMore', emits: ['load-more'], template: '<button class="load-more" @click="$emit(\'load-more\')" />' },
        },
      },
    }),
    fetchMore,
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mod profile issues page', () => {
  it('shows the empty-state message when the mod has opened no issues', async () => {
    const { wrapper } = await mountWith({ authoredIssues: [] });
    expect(wrapper.text()).toContain('This mod has not opened any issues');
  });

  it('renders an item per authored issue', async () => {
    const { wrapper } = await mountWith({ authoredIssues: [{ id: 'i1' }, { id: 'i2' }] });
    expect(wrapper.findAllComponents(ModIssueListItem)).toHaveLength(2);
  });

  it('shows the issue query error banner', async () => {
    const { wrapper } = await mountWith({
      authoredIssues: [],
      issueError: { message: 'issue failed' },
    });
    expect(wrapper.text()).toContain('issue failed');
  });

  it('requests the next page when LoadMore emits', async () => {
    const { wrapper, fetchMore } = await mountWith({
      authoredIssues: [{ id: 'i1' }, { id: 'i2' }],
    });
    await wrapper.get('.load-more').trigger('click');
    expect(fetchMore).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          limit: 25,
          offset: 2,
        },
      })
    );
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, reactive } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import ModIssueListItem from '@/components/mod/ModIssueListItem.vue';

const routeState = vi.hoisted(() => ({ params: { modId: 'coolmod' } }));
vi.mock('nuxt/app', () => ({ useRoute: () => reactive(routeState) }));

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
  routeState.params.modId = 'coolmod';
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
          displayName: 'coolmod',
          limit: 25,
          offset: 2,
        },
      })
    );
  });
  it('rejects a page completed after navigating to another moderator', async () => {
    const { wrapper, fetchMore } = await mountWith({ authoredIssues: [{ id: 'i1' }] });
    await wrapper.get('.load-more').trigger('click');
    const previous = { moderationProfiles: [{ AuthoredIssues: [{ id: 'i1' }] }] };
    reactive(routeState).params.modId = 'other';
    const options = fetchMore.mock.calls[0]?.[0];
    expect(options.updateQuery(previous, { fetchMoreResult: { moderationProfiles: [{ AuthoredIssues: [{ id: 'i2' }] }] } })).toBe(previous);
  });

  it('deduplicates repeated issue pagination results', async () => {
    const { wrapper, fetchMore } = await mountWith({ authoredIssues: [{ id: 'i1' }] });
    await wrapper.get('.load-more').trigger('click');
    const previous = { moderationProfiles: [{ AuthoredIssues: [{ id: 'i1' }] }] };
    const options = fetchMore.mock.calls[0]?.[0];
    expect(options.updateQuery(previous, { fetchMoreResult: previous }).moderationProfiles[0].AuthoredIssues).toEqual([{ id: 'i1' }]);
  });

});

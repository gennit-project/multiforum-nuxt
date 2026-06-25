import { describe, it, expect, vi } from 'vitest';
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

const mountWith = async (authoredIssues: unknown[]) => {
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({
        moderationProfiles: [{ AuthoredIssuesAggregate: { count: authoredIssues.length } }],
      }),
      error: ref(null),
    })
    .mockReturnValueOnce({
      result: ref({ moderationProfiles: [{ AuthoredIssues: authoredIssues }] }),
      loading: ref(false),
      error: ref(null),
      fetchMore: vi.fn(),
    });
  const Page = (await import('./issues.vue')).default;
  return shallowMount(Page, {
    global: { stubs: { ErrorBanner: true, LoadMore: true } },
  });
};

describe('mod profile issues page', () => {
  it('shows the empty-state message when the mod has opened no issues', async () => {
    const wrapper = await mountWith([]);
    expect(wrapper.text()).toContain('This mod has not opened any issues');
  });

  it('renders an item per authored issue', async () => {
    const wrapper = await mountWith([{ id: 'i1' }, { id: 'i2' }]);
    expect(wrapper.findAllComponents(ModIssueListItem)).toHaveLength(2);
  });
});

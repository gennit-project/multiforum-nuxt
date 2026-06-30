import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import ModIssueListItem from '@/components/mod/ModIssueListItem.vue';

const query: Record<string, string> = {};

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: '' }, query }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (opts: { loading?: boolean; issues?: unknown[] }) => {
  const { loading = false, issues = [] } = opts;
  mockedUseQuery.mockReturnValue({
    result: ref({ issues }),
    error: ref(null),
    loading: ref(loading),
    refetch: vi.fn(),
  });
  const Page = (await import('./index.vue')).default;
  return shallowMount(Page);
};

describe('admin server issues index page', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockedUseQuery.mockReset();
    query.showOnlyServerRuleViolations = '';
    query.startDate = '2026-05-27';
    query.endDate = '2026-06-26';
    delete query.channels;
  });

  it('defaults the server-rule-violations checkbox to checked', async () => {
    const wrapper = await mountWith({ issues: [] });
    expect(
      (wrapper.get('[data-testid="show-only-server-rule-violations"]')
        .element as HTMLInputElement).checked
    ).toBe(true);
  });

  it('unchecks the filter when the query opts out', async () => {
    query.showOnlyServerRuleViolations = 'false';
    const wrapper = await mountWith({ issues: [] });
    expect(
      (wrapper.get('[data-testid="show-only-server-rule-violations"]')
        .element as HTMLInputElement).checked
    ).toBe(false);
  });

  it('renders an item per issue', async () => {
    const wrapper = await mountWith({ issues: [{ id: 'i1' }, { id: 'i2' }] });
    expect(wrapper.findAllComponents(ModIssueListItem)).toHaveLength(2);
  });

  it('renders no issues while the query is loading', async () => {
    const wrapper = await mountWith({ loading: true, issues: [{ id: 'i1' }] });
    expect(wrapper.findAllComponents(ModIssueListItem)).toHaveLength(0);
  });

  it('passes the selected channel filter into the issues query variables', async () => {
    query.channels = 'announcements';
    await mountWith({ issues: [] });
    expect(mockedUseQuery.mock.calls[0][1].value.issueWhere).toMatchObject({
      channelUniqueName_IN: ['announcements'],
    });
  });

  it('passes the selected date range into the issues query variables', async () => {
    await mountWith({ issues: [] });
    expect(mockedUseQuery.mock.calls[0][1].value.issueWhere).toMatchObject({
      createdAt_GTE: '2026-05-27T00:00:00.000Z',
      createdAt_LTE: '2026-06-26T23:59:59.999Z',
    });
  });
});

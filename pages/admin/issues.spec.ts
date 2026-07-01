import { beforeEach, describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

const h = vi.hoisted(() => ({
  routeName: 'admin-issues',
  query: {
    showOnlyServerRuleViolations: '',
    searchInput: '',
  } as Record<string, string>,
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ name: h.routeName, query: h.query }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const SlotStub = {
  template: '<div><slot name="has-auth" /><slot /></div>',
};

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountPage = async (open: number, closed: number) => {
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({ issuesAggregate: { count: open } }),
      error: ref(null),
      loading: ref(false),
    })
    .mockReturnValueOnce({
      result: ref({ issuesAggregate: { count: closed } }),
      error: ref(null),
      loading: ref(false),
    });
  const Page = (await import('./issues.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        RequireAuth: SlotStub,
        NuxtLink: { template: '<a><slot /></a>' },
        NuxtPage: true,
      },
    },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  h.routeName = 'admin-issues';
  h.query.showOnlyServerRuleViolations = '';
  h.query.searchInput = '';
  delete h.query.startDate;
  delete h.query.endDate;
  delete h.query.channels;
});

describe('admin issues layout page', () => {
  it('passes the current date filters into the open count query', async () => {
    h.query.startDate = '2026-05-01';
    h.query.endDate = '2026-07-01';

    await mountPage(5, 3);

    expect(mockedUseQuery.mock.calls[0][1].value.issueWhere).toMatchObject({
      isOpen: true,
      flaggedServerRuleViolation: true,
      createdAt_GTE: '2026-05-01T00:00:00.000Z',
      createdAt_LTE: '2026-07-01T23:59:59.999Z',
    });
  });

  it('omits date bounds from the count query when no dates are set', async () => {
    delete h.query.startDate;
    delete h.query.endDate;

    await mountPage(5, 3);

    expect(mockedUseQuery.mock.calls[0][1].value.issueWhere).not.toHaveProperty(
      'createdAt_GTE'
    );
    expect(mockedUseQuery.mock.calls[0][1].value.issueWhere).not.toHaveProperty(
      'createdAt_LTE'
    );
  });

  it('shows the open issue count from the aggregate', async () => {
    const wrapper = await mountPage(5, 3);
    expect(wrapper.text()).toContain('5 Open');
  });

  it('shows the closed issue count from the aggregate', async () => {
    const wrapper = await mountPage(5, 3);
    expect(wrapper.text()).toContain('3 Closed');
  });
});

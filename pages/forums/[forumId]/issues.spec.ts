import { beforeEach, describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

const mockState = vi.hoisted(() => ({
  route: {
    params: { forumId: 'cats' } as Record<string, string>,
    name: 'forums-forumId-issues',
  },
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => mockState.route,
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const RequireAuthStub = {
  template: '<div><slot name="has-auth" /></div>',
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
        RequireAuth: RequireAuthStub,
        NuxtLink: { template: '<a><slot /></a>' },
        NuxtPage: true,
      },
    },
  });
};

describe('forum issues layout page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.route.params = { forumId: 'cats' };
    mockState.route.name = 'forums-forumId-issues';
  });

  it('shows the open issue count', async () => {
    expect((await mountPage(7, 2)).text()).toContain('7 Open');
  });

  it('shows the closed issue count', async () => {
    expect((await mountPage(7, 2)).text()).toContain('2 Closed');
  });

  it('does not fetch list counts behind an issue detail page', async () => {
    mockState.route.params = { forumId: 'cats', issueNumber: '42' };
    mockState.route.name = 'forums-forumId-issues-issueNumber';

    await mountPage(7, 2);

    const queryOptions = mockedUseQuery.mock.calls.slice(0, 2).map((call) => {
      const options = call[2];
      return typeof options === 'function' ? options() : options;
    });

    expect(queryOptions).toEqual([
      { enabled: false, prefetch: false },
      { enabled: false, prefetch: false },
    ]);
  });
});

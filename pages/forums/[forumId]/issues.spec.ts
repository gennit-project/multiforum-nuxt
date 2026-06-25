import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' }, name: 'forums-forumId-issues' }),
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
  it('shows the open issue count', async () => {
    expect((await mountPage(7, 2)).text()).toContain('7 Open');
  });

  it('shows the closed issue count', async () => {
    expect((await mountPage(7, 2)).text()).toContain('2 Closed');
  });
});

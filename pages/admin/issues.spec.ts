import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ name: 'admin-issues' }),
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

describe('admin issues layout page', () => {
  it('shows the open issue count from the aggregate', async () => {
    const wrapper = await mountPage(5, 3);
    expect(wrapper.text()).toContain('5 Open');
  });

  it('shows the closed issue count from the aggregate', async () => {
    const wrapper = await mountPage(5, 3);
    expect(wrapper.text()).toContain('3 Closed');
  });
});

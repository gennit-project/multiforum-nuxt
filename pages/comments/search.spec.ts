import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery } from '@vue/apollo-composable';

const routeQuery: Record<string, unknown> = {};

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({ push: vi.fn() }),
  useHead: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (opts: {
  searchInput?: string;
  comments?: unknown[];
  count?: number;
}) => {
  routeQuery.searchInput = opts.searchInput;
  mockedUseQuery.mockReturnValue({
    result: ref({
      comments: opts.comments ?? [],
      commentsAggregate: { count: opts.count ?? 0 },
    }),
    loading: ref(false),
    error: ref(null),
    fetchMore: vi.fn(),
  });
  const Page = (await import('./search.vue')).default;
  return shallowMount(Page, {
    global: { stubs: { NuxtLayout: NuxtLayoutStub } },
  });
};

describe('comment search page', () => {
  it('prompts for a search term when the input is empty', async () => {
    const wrapper = await mountWith({ searchInput: '' });
    expect(wrapper.text()).toContain('Enter a search term to find comments.');
  });

  it('shows the total result count for a search', async () => {
    const wrapper = await mountWith({
      searchInput: 'hello',
      comments: [{ id: 'c1' }],
      count: 1,
    });
    expect(wrapper.text()).toContain('1 comment found');
  });

  it('shows a no-results message when nothing matches', async () => {
    const wrapper = await mountWith({
      searchInput: 'zzz',
      comments: [],
      count: 0,
    });
    expect(wrapper.text()).toContain('No comments match your search.');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import ErrorBanner from '@/components/ErrorBanner.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { collectionId: 'col-1' } }),
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

const mountWith = async (state: {
  result?: unknown;
  loading?: boolean;
  error?: unknown;
}) => {
  mockedUseQuery.mockReturnValue({
    result: ref(state.result ?? null),
    loading: ref(state.loading ?? false),
    error: ref(state.error ?? null),
    refetch: vi.fn(),
  });
  const Page = (await import('./[collectionId].vue')).default;
  return shallowMount(Page, {
    global: { stubs: { NuxtLayout: NuxtLayoutStub } },
  });
};

describe('public collection detail page', () => {
  it('shows the collection name when a public collection loads', async () => {
    const wrapper = await mountWith({
      result: {
        collections: [
          { id: 'col-1', name: 'Cat GIFs', Downloads: [], DownloadsAggregate: { count: 0 } },
        ],
      },
    });
    expect(wrapper.text()).toContain('Cat GIFs');
  });

  it('shows an error banner when the query fails', async () => {
    const wrapper = await mountWith({ error: { message: 'boom' } });
    expect(wrapper.findComponent(ErrorBanner).props('text')).toBe('boom');
  });

  it('shows an unavailable message when the collection is not public', async () => {
    const wrapper = await mountWith({ result: { collections: [] } });
    expect(wrapper.text()).toContain(
      'This collection is not available or is not public.'
    );
  });
});

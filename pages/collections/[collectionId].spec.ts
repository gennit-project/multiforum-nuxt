import { beforeEach, describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import ErrorBanner from '@/components/ErrorBanner.vue';

const routeState = vi.hoisted(() => ({
  route: { params: { collectionId: 'col-1' } } as {
    params: { collectionId: string | string[] | undefined };
  },
}));
vi.mock('nuxt/app', async () => {
  const { reactive } = await import('vue');
  routeState.route = reactive({ params: { collectionId: 'col-1' } });
  return { useRoute: () => routeState.route, useHead: vi.fn() };
});
beforeEach(() => {
  routeState.route.params.collectionId = 'col-1';
});

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
    fetchMore: vi.fn(),
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
          {
            id: 'col-1',
            name: 'Cat GIFs',
            Downloads: [],
            DownloadsConnection: { aggregate: { count: { nodes: 0 } } },
          },
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

describe('public collection query navigation', () => {
  it.each([undefined, ['col-1', 'col-2']])(
    'disables invalid collection IDs',
    async (id) => {
      routeState.route.params.collectionId = id;
      await mountWith({});
      const [, variables, options] = mockedUseQuery.mock.calls.at(-1)!;
      expect({
        variables: variables(),
        enabled: options.enabled.value,
      }).toEqual({
        variables: { collectionId: '', downloadLimit: 20, downloadOffset: 0 },
        enabled: false,
      });
    }
  );
  it('hides the old collection when navigating to another collection', async () => {
    const wrapper = await mountWith({
      result: {
        collections: [{ id: 'col-1', name: 'Old collection', Downloads: [] }],
      },
    });
    routeState.route.params.collectionId = 'col-2';
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).not.toContain('Old collection');
  });
});

describe('public collection pagination', () => {
  const collection = {
    id: 'col-1',
    name: 'Downloads',
    Downloads: [{ id: 'd1' }],
    DownloadsConnection: { aggregate: { count: { nodes: 3 } } },
  };
  it('deduplicates overlapping pages', async () => {
    const wrapper = await mountWith({ result: { collections: [collection] } });
    await wrapper.find('button').trigger('click');
    const query = mockedUseQuery.mock.results.at(-1)!.value;
    const { updateQuery } = query.fetchMore.mock.calls[0][0];
    const result = updateQuery(
      { collections: [collection] },
      {
        fetchMoreResult: {
          collections: [
            { ...collection, Downloads: [{ id: 'd1' }, { id: 'd2' }] },
          ],
        },
      }
    );
    expect(
      result.collections[0].Downloads.map((item: { id: string }) => item.id)
    ).toEqual(['d1', 'd2']);
  });
  it('rejects a page completed after navigation', async () => {
    const previous = { collections: [collection] };
    const wrapper = await mountWith({ result: previous });
    await wrapper.find('button').trigger('click');
    const { updateQuery } =
      mockedUseQuery.mock.results.at(-1)!.value.fetchMore.mock.calls[0][0];
    routeState.route.params.collectionId = 'col-2';
    await wrapper.vm.$nextTick();
    expect(updateQuery(previous, { fetchMoreResult: previous })).toBe(previous);
  });
  it('retains existing data when a page has no matching collection', async () => {
    const previous = { collections: [collection] };
    const wrapper = await mountWith({ result: previous });
    await wrapper.find('button').trigger('click');
    const { updateQuery } =
      mockedUseQuery.mock.results.at(-1)!.value.fetchMore.mock.calls[0][0];
    expect(
      updateQuery(previous, { fetchMoreResult: { collections: [] } })
    ).toBe(previous);
  });
});

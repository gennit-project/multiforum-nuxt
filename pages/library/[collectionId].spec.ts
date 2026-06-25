import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery } from '@vue/apollo-composable';

vi.mock('nuxt/app', () => ({ useHead: vi.fn() }));

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { collectionId: 'col-1' } }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: () => ({
    mutate: vi.fn(),
    loading: ref(false),
    error: ref(null),
    onDone: vi.fn(),
    onError: vi.fn(),
  }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({ serverAdminUsernames: ref([]) }),
}));

const RequireAuthStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.() ?? slots['has-auth']?.());
  },
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (collection: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ collections: collection ? [collection] : [] }),
    loading: ref(false),
    error: ref(null),
    refetch: vi.fn(),
  });
  const Page = (await import('./[collectionId].vue')).default;
  return shallowMount(Page, {
    global: { stubs: { RequireAuth: RequireAuthStub } },
  });
};

describe('library collection detail page', () => {
  it('shows the collection name when it loads', async () => {
    const wrapper = await mountWith({
      id: 'col-1',
      name: 'Cat GIFs',
      collectionType: 'DISCUSSIONS',
      visibility: 'PUBLIC',
      Discussions: [],
      itemCount: 0,
    });
    expect(wrapper.text()).toContain('Cat GIFs');
  });
});

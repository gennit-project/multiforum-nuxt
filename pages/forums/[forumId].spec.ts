import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import PageNotFound from '@/components/PageNotFound.vue';
import ChannelTabs from '@/components/channel/ChannelTabs.vue';

vi.stubGlobal('definePageMeta', vi.fn());

const routeRef = { params: { forumId: 'cats' }, name: 'forums-forumId', query: {} };

vi.mock('nuxt/app', () => ({
  useRoute: () => routeRef,
  useRouter: () => ({ push: vi.fn() }),
  useHead: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('viewer'),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (channels: unknown[]) => {
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({ channels }),
      onResult: vi.fn(),
      loading: ref(false),
      refetch: vi.fn(),
    })
    .mockReturnValueOnce({ result: ref(null) });
  const Page = (await import('./[forumId].vue')).default;
  return shallowMount(Page);
};

describe('forum shell page', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    routeRef.name = 'forums-forumId';
  });

  it('shows the not-found page when the channel does not exist', async () => {
    const wrapper = await mountWith([]);
    expect(wrapper.findComponent(PageNotFound).exists()).toBe(true);
  });

  it('renders the channel tabs on the plain forum route', async () => {
    const wrapper = await mountWith([{ uniqueName: 'cats', displayName: 'Cats' }]);
    expect(wrapper.findComponent(ChannelTabs).exists()).toBe(true);
  });
});

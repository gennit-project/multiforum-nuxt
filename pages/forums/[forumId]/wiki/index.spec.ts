import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' } }),
  useRouter: () => ({ push: vi.fn() }),
  useHead: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

vi.mock('@/composables/useSuspensionNotice', () => ({
  useChannelSuspensionNotice: () => ({
    activeSuspension: ref(null),
    issueNumber: ref(null),
    suspendedUntil: ref(null),
    suspendedIndefinitely: ref(false),
    channelId: ref('cats'),
  }),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (channel: unknown) => {
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({ channels: [channel] }),
      loading: ref(false),
      error: ref(null),
    })
    .mockReturnValueOnce({ onResult: vi.fn() });
  const Page = (await import('./index.vue')).default;
  return shallowMount(Page);
};

describe('wiki home page', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('renders the wiki home page body when one exists', async () => {
    const wrapper = await mountWith({
      wikiEnabled: true,
      WikiHomePage: { title: 'Home', body: 'Welcome home' },
    });
    expect(wrapper.findComponent(MarkdownRenderer).props('text')).toBe(
      'Welcome home'
    );
  });

  it('shows a create prompt when there is no home page', async () => {
    const wrapper = await mountWith({ wikiEnabled: true, WikiHomePage: null });
    expect(wrapper.findComponent(MarkdownRenderer).exists()).toBe(false);
  });
});

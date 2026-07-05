import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats', slug: 'intro' } }),
  useRouter: () => ({ push: vi.fn() }),
  useHead: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('bob'),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (
  wikiPage: unknown,
  channelOverrides: Record<string, unknown> = {}
) => {
  mockedUseQuery
    // wiki page data
    .mockReturnValueOnce({
      result: ref({ wikiPages: wikiPage ? [wikiPage] : [] }),
      loading: ref(false),
      error: ref(null),
      refetch: vi.fn(),
    })
    // channel (wikiEnabled)
    .mockReturnValueOnce({
      result: ref({
        channels: [
          {
            wikiEnabled: true,
            Admins: [{ username: 'alice' }],
            ElevatedChannelRole: { canUpdateChannel: true },
            ...channelOverrides,
          },
        ],
      }),
      loading: ref(false),
      error: ref(null),
      refetch: vi.fn(),
    })
    // SEO query (onResult callback)
    .mockReturnValueOnce({ onResult: vi.fn() });
  const Page = (await import('./[slug].vue')).default;
  return shallowMount(Page);
};

describe('wiki page', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('renders the wiki body through the markdown renderer', async () => {
    const wrapper = await mountWith({ title: 'Intro', body: 'Welcome to the wiki' });
    expect(wrapper.findComponent(MarkdownRenderer).props('text')).toBe(
      'Welcome to the wiki'
    );
  });

  it('shows a locked notice when the wiki page is locked', async () => {
    const wrapper = await mountWith({
      title: 'Intro',
      body: 'Welcome',
      locked: true,
      lockReason: 'Canon settled',
    });

    expect(wrapper.text()).toContain('Canon settled');
  });
});

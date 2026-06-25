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

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (wikiPage: unknown) => {
  mockedUseQuery
    // wiki page data
    .mockReturnValueOnce({
      result: ref({ wikiPages: wikiPage ? [wikiPage] : [] }),
      loading: ref(false),
      error: ref(null),
    })
    // channel (wikiEnabled)
    .mockReturnValueOnce({
      result: ref({ channels: [{ wikiEnabled: true }] }),
      loading: ref(false),
      error: ref(null),
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
});

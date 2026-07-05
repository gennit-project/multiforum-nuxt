import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats', slug: 'intro' } }),
  useRouter: () => ({ push: vi.fn() }),
  useHead: vi.fn(),
  useState: (_key: string, init?: () => unknown) => ref(init ? init() : ''),
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
    // server config (wiki lock permissions)
    .mockReturnValueOnce({
      result: ref({ serverConfigs: [] }),
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

  it('shows a locked banner for locked wiki pages', async () => {
    const wrapper = await mountWith({
      title: 'Intro',
      body: 'Welcome to the wiki',
      locked: true,
      lockReason: 'Vandalism',
    });
    expect(wrapper.find('[data-testid="wiki-page-locked-banner"]').exists()).toBe(
      true
    );
  });

  it('hides edit buttons for locked wiki pages without lock permission', async () => {
    const wrapper = await mountWith({
      title: 'Intro',
      body: 'Welcome to the wiki',
      locked: true,
    });
    expect(
      wrapper
        .findAllComponents(PrimaryButton)
        .some((button) => button.props('label') === 'Edit Page')
    ).toBe(false);
  });
});

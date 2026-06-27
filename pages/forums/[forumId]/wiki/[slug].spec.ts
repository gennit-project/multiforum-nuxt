import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import SuspensionNotice from '@/components/SuspensionNotice.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats', slug: 'intro' } }),
  useRouter: () => ({ push: vi.fn() }),
  useHead: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));

// Mutable suspension state the mocked composable reads at mount time.
const suspensionState = vi.hoisted(() => ({
  activeSuspension: null as unknown,
  issueNumber: null as number | null,
}));

vi.mock('@/composables/useSuspensionNotice', async () => {
  const { ref: r } = await import('vue');
  return {
    useChannelSuspensionNotice: () => ({
      activeSuspension: r(suspensionState.activeSuspension),
      issueNumber: r(suspensionState.issueNumber),
      suspendedUntil: r(null),
      suspendedIndefinitely: r(false),
      channelId: r('cats'),
    }),
  };
});

vi.mock('@/composables/useAuthState', async () => {
  const { ref: r } = await import('vue');
  return { useUsername: () => r('alice') };
});

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
  beforeEach(() => {
    setActivePinia(createPinia());
    suspensionState.activeSuspension = null;
    suspensionState.issueNumber = null;
    mockedUseQuery.mockReset();
  });

  it('renders the wiki body through the markdown renderer', async () => {
    const wrapper = await mountWith({ title: 'Intro', body: 'Welcome to the wiki' });
    expect(wrapper.findComponent(MarkdownRenderer).props('text')).toBe(
      'Welcome to the wiki'
    );
  });

  it('keeps the edit action enabled and hides the notice for an unsuspended user', async () => {
    const wrapper = await mountWith({
      title: 'Intro',
      slug: 'intro',
      body: 'Welcome',
    });

    expect(wrapper.findComponent(PrimaryButton).props('disabled')).toBeFalsy();
    expect(wrapper.findComponent(SuspensionNotice).exists()).toBe(false);
  });

  it('disables the edit action and shows a suspension notice for a suspended user', async () => {
    suspensionState.activeSuspension = { suspendedIndefinitely: true };
    suspensionState.issueNumber = 42;

    const wrapper = await mountWith({
      title: 'Intro',
      slug: 'intro',
      body: 'Welcome',
    });

    expect(wrapper.findComponent(PrimaryButton).props('disabled')).toBe(true);
    expect(wrapper.findComponent(SuspensionNotice).exists()).toBe(true);

    const bottomEdit = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Edit this page'));
    expect(bottomEdit?.attributes('disabled')).toBeDefined();
  });
});

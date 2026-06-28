import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import GenericButton from '@/components/GenericButton.vue';
import SuspensionNotice from '@/components/SuspensionNotice.vue';

const suspension = vi.hoisted(() => ({
  active: null as unknown,
  issueNumber: null as number | null,
}));

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
    activeSuspension: ref(suspension.active),
    issueNumber: ref(suspension.issueNumber),
    suspendedUntil: ref(null),
    suspendedIndefinitely: ref(false),
    channelId: ref('cats'),
  }),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (channel: unknown, stubs: Record<string, unknown> = {}) => {
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({ channels: [channel] }),
      loading: ref(false),
      error: ref(null),
    })
    .mockReturnValueOnce({ onResult: vi.fn() });
  const Page = (await import('./index.vue')).default;
  return shallowMount(Page, { global: { stubs } });
};

describe('wiki home page', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    suspension.active = null;
    suspension.issueNumber = null;
    mockedUseQuery.mockReset();
  });

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

  it('disables wiki edit buttons and shows a notice for a suspended user', async () => {
    suspension.active = { suspendedIndefinitely: true };
    suspension.issueNumber = 5;
    const wrapper = await mountWith(
      { wikiEnabled: true, WikiHomePage: { title: 'Home', body: 'Welcome' } },
      // Render RequireAuth's has-auth slot so the gated buttons mount.
      { RequireAuth: { template: '<div><slot name="has-auth" /></div>' } }
    );

    expect(wrapper.findComponent(SuspensionNotice).exists()).toBe(true);
    const buttons = wrapper.findAllComponents(GenericButton);
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.every((b) => b.props('disabled') === true)).toBe(true);
  });
});

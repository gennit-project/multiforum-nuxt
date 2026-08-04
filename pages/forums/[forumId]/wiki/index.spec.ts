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
  routerPush: vi.fn(),
  useHead: vi.fn(),
  onResult: null as null | ((result: unknown) => void),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' } }),
  useRouter: () => ({ push: suspension.routerPush }),
  useHead: suspension.useHead,
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

const mountWith = async (
  channel: unknown,
  stubs: Record<string, unknown> = {},
  queryState: { loading?: boolean; error?: unknown } = {}
) => {
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({ channels: [channel] }),
      loading: ref(queryState.loading ?? false),
      error: ref(queryState.error ?? null),
    })
    .mockReturnValueOnce({
      onResult: (callback: (result: unknown) => void) => {
        suspension.onResult = callback;
      },
    });
  const Page = (await import('./index.vue')).default;
  return shallowMount(Page, { global: { stubs } });
};

describe('wiki home page', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    suspension.active = null;
    suspension.issueNumber = null;
    suspension.onResult = null;
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

    const buttons = wrapper.findAllComponents(GenericButton);
    expect({
      notice: wrapper.findComponent(SuspensionNotice).exists(),
      buttonCount: buttons.length,
      disabled: buttons.every((button) => button.props('disabled') === true),
    }).toEqual({ notice: true, buttonCount: 2, disabled: true });
  });

  it('gives the mobile wiki title its own wrapping row', async () => {
    const wrapper = await mountWith({
      wikiEnabled: true,
      WikiHomePage: { title: 'A very long wiki title', body: 'Welcome' },
    });

    expect(wrapper.get('[data-testid="wiki-page-title"]').classes()).toEqual(
      expect.arrayContaining(['min-w-0', 'wrap-break-word'])
    );
  });

  it('places the mobile font-size picker after the wiki body', async () => {
    const wrapper = await mountWith({
      wikiEnabled: true,
      WikiHomePage: { title: 'Home', body: 'Welcome' },
    });
    const markdown = wrapper.findComponent(MarkdownRenderer).element;
    const fontSize = wrapper.get(
      '[data-testid="mobile-wiki-font-size"]'
    ).element;

    expect(
      markdown.compareDocumentPosition(fontSize) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('removes markdown formatting from child-page list titles', async () => {
    const wrapper = await mountWith({
      wikiEnabled: true,
      WikiHomePage: {
        title: 'Home',
        body: 'Welcome',
        ChildPages: [
          {
            id: 'child',
            title: '**Child** [Guide](https://example.com)',
            slug: 'child',
          },
        ],
      },
    });

    expect(wrapper.text()).toContain('Child Guide');
  });

  it('shows the loading state', async () => {
    const wrapper = await mountWith(null, {}, { loading: true });

    expect(wrapper.findComponent({ name: 'LoadingSpinner' }).exists()).toBe(
      true
    );
  });

  it('shows the query error', async () => {
    const wrapper = await mountWith(
      null,
      {},
      { error: { message: 'Offline' } }
    );

    expect(wrapper.text()).toContain('Offline');
  });

  it('shows the disabled state when the forum wiki is unavailable', async () => {
    const wrapper = await mountWith({ wikiEnabled: false });

    expect(wrapper.text()).toContain(
      'The wiki feature is not enabled for this forum.'
    );
  });

  it.each([
    ['Create Wiki Page', '/forums/cats/wiki/create'],
    ['Add Page', '/forums/cats/wiki/create-child'],
    ['Edit Wiki', '/forums/cats/wiki/edit/home'],
  ])('routes the %s action', async (buttonText, expectedRoute) => {
    const wrapper = await mountWith(
      {
        wikiEnabled: true,
        WikiHomePage:
          buttonText === 'Create Wiki Page'
            ? null
            : { title: 'Home', slug: 'home', body: 'Welcome' },
      },
      { RequireAuth: { template: '<div><slot name="has-auth" /></div>' } }
    );
    await wrapper
      .findAllComponents(GenericButton)
      .find((button) => button.props('text') === buttonText)
      ?.vm.$emit('click');

    expect(suspension.routerPush).toHaveBeenCalledWith(expectedRoute);
  });

  it('does not route an edit action while the user is suspended', async () => {
    suspension.active = { suspendedIndefinitely: true };
    const wrapper = await mountWith(
      {
        wikiEnabled: true,
        WikiHomePage: { title: 'Home', slug: 'home', body: 'Welcome' },
      },
      { RequireAuth: { template: '<div><slot name="has-auth" /></div>' } }
    );
    await wrapper
      .findAllComponents(GenericButton)
      .find((button) => button.props('text') === 'Edit Wiki')
      ?.vm.$emit('click');

    expect(suspension.routerPush).not.toHaveBeenCalled();
  });

  it('applies SEO metadata when the channel query completes', async () => {
    await mountWith({ wikiEnabled: true, WikiHomePage: null });
    suspension.onResult?.({
      data: { channels: [{ WikiHomePage: { title: 'Home' } }] },
    });

    expect(suspension.useHead).toHaveBeenCalledOnce();
  });
});

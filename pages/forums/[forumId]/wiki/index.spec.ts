import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import GenericButton from '@/components/GenericButton.vue';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';
import SearchBar from '@/components/SearchBar.vue';
import SuspensionNotice from '@/components/SuspensionNotice.vue';

const testState = vi.hoisted(() => ({
  activeSuspension: null as unknown,
  issueNumber: null as number | null,
  routerPush: vi.fn(),
  useHead: vi.fn(),
  onChannelResult: null as null | ((result: unknown) => void),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats' } }),
  useRouter: () => ({ push: testState.routerPush }),
  useHead: testState.useHead,
}));

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

vi.mock('@/composables/useSuspensionNotice', () => ({
  useChannelSuspensionNotice: () => ({
    activeSuspension: ref(testState.activeSuspension),
    issueNumber: ref(testState.issueNumber),
    suspendedUntil: ref(null),
    suspendedIndefinitely: ref(false),
    channelId: ref('cats'),
  }),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

type QueryState = {
  channelLoading?: boolean;
  channelError?: unknown;
  wikiLoading?: boolean;
  wikiError?: unknown;
};

const homePage = {
  id: 'home',
  title: '**Cats** introduction',
  slug: 'home',
  body: '# Welcome\nEverything about cats.',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const mountWith = async ({
  channel = {
    uniqueName: 'cats',
    displayName: 'Cats',
    wikiEnabled: true,
    WikiHomePage: homePage,
    PinnedWikiPages: [],
  },
  wikiPages = [homePage],
  queryState = {},
  stubs = {},
}: {
  channel?: unknown;
  wikiPages?: unknown[];
  queryState?: QueryState;
  stubs?: Record<string, unknown>;
} = {}) => {
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({ channels: channel ? [channel] : [] }),
      loading: ref(queryState.channelLoading ?? false),
      error: ref(queryState.channelError ?? null),
      onResult: (callback: (result: unknown) => void) => {
        testState.onChannelResult = callback;
      },
    })
    .mockReturnValueOnce({
      result: ref({
        getSiteWideWikiList: {
          wikiPages,
          featuredWikiPages: [],
          aggregateWikiPageCount: wikiPages.length,
        },
      }),
      loading: ref(queryState.wikiLoading ?? false),
      error: ref(queryState.wikiError ?? null),
    });

  const Page = (await import('./index.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
        ...stubs,
      },
    },
  });
};

describe('channel wiki landing page', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockedUseQuery.mockReset();
    testState.activeSuspension = null;
    testState.issueNumber = null;
    testState.onChannelResult = null;
  });

  it('renders the authored home page as a compact introduction', async () => {
    const wrapper = await mountWith();

    expect(wrapper.get('[data-testid="wiki-introduction"]').text()).toContain(
      'Welcome Everything about cats.'
    );
  });

  it('links the introduction to the full home article', async () => {
    const wrapper = await mountWith();

    expect(
      wrapper
        .get('[data-testid="wiki-introduction"] a')
        .attributes('href')
    ).toBe('/forums/cats/wiki/home');
  });

  it('requests the wiki list for only the current forum', async () => {
    await mountWith();

    expect(mockedUseQuery.mock.calls[1][1]).toMatchObject({
      selectedChannels: ['cats'],
      options: { limit: 100, offset: 0 },
    });
  });

  it('renders pinned pages before the regular directory', async () => {
    const pinnedPage = {
      id: 'care',
      title: 'Cat care',
      slug: 'care',
      body: 'Care guide',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const wrapper = await mountWith({
      channel: {
        displayName: 'Cats',
        wikiEnabled: true,
        WikiHomePage: homePage,
        PinnedWikiPages: [{ id: 'care' }],
      },
      wikiPages: [homePage, pinnedPage],
    });

    expect(wrapper.findComponent(HighlightedSearchTerms).props('text')).toBe(
      'Cat care'
    );
  });

  it('does not duplicate pinned pages in the regular directory', async () => {
    const pinnedPage = {
      id: 'care',
      title: 'Cat care',
      slug: 'care',
      body: 'Care guide',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const wrapper = await mountWith({
      channel: {
        displayName: 'Cats',
        wikiEnabled: true,
        WikiHomePage: homePage,
        PinnedWikiPages: [{ id: 'care' }],
      },
      wikiPages: [homePage, pinnedPage],
    });

    expect(wrapper.findAll('[data-testid="channel-wiki-card"]')).toHaveLength(
      0
    );
  });

  it('renders all unpinned child pages as directory cards', async () => {
    const wrapper = await mountWith({
      wikiPages: [
        homePage,
        {
          id: 'care',
          title: 'Cat care',
          slug: 'care',
          body: 'Care guide',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'food',
          title: 'Cat food',
          slug: 'food',
          body: 'Food guide',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    expect(wrapper.findAll('[data-testid="channel-wiki-card"]')).toHaveLength(
      2
    );
  });

  it('passes plain-text titles to directory highlighting', async () => {
    const wrapper = await mountWith({
      wikiPages: [
        homePage,
        {
          id: 'care',
          title: '**Cat** [Care](https://example.com)',
          slug: 'care',
          body: 'Care guide',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    expect(wrapper.findComponent(HighlightedSearchTerms).props('text')).toBe(
      'Cat Care'
    );
  });

  it('shows a search-specific empty state', async () => {
    const wrapper = await mountWith({ wikiPages: [] });
    await wrapper.findComponent(SearchBar).vm.$emit('updateSearchInput', 'dogs');

    expect(wrapper.text()).toContain('No pages match your search.');
  });

  it('shows a create prompt when there is no home page', async () => {
    const wrapper = await mountWith({
      channel: { wikiEnabled: true, WikiHomePage: null },
      wikiPages: [],
    });

    expect(wrapper.text()).toContain("Start this forum's wiki");
  });

  it('disables wiki actions and shows a notice for a suspended user', async () => {
    testState.activeSuspension = { suspendedIndefinitely: true };
    testState.issueNumber = 5;
    const wrapper = await mountWith({
      stubs: { RequireAuth: { template: '<div><slot name="has-auth" /></div>' } },
    });

    expect({
      notice: wrapper.findComponent(SuspensionNotice).exists(),
      disabled: wrapper
        .findAllComponents(GenericButton)
        .every((button) => button.props('disabled') === true),
    }).toEqual({ notice: true, disabled: true });
  });

  it('shows the loading state while either query is loading', async () => {
    const wrapper = await mountWith({ queryState: { wikiLoading: true } });

    expect(wrapper.findComponent({ name: 'LoadingSpinner' }).exists()).toBe(
      true
    );
  });

  it('shows a query error', async () => {
    const wrapper = await mountWith({
      queryState: { wikiError: { message: 'Offline' } },
    });

    expect(wrapper.text()).toContain('Offline');
  });

  it('shows the disabled state when the forum wiki is unavailable', async () => {
    const wrapper = await mountWith({
      channel: { wikiEnabled: false, WikiHomePage: null },
      wikiPages: [],
    });

    expect(wrapper.text()).toContain(
      'The wiki feature is not enabled for this forum.'
    );
  });

  it.each([
    ['Create Wiki Page', '/forums/cats/wiki/create', false],
    ['Add Page', '/forums/cats/wiki/create-child', true],
    ['Edit introduction', '/forums/cats/wiki/edit/home', true],
  ])('routes the %s action', async (buttonText, expectedRoute, hasHomePage) => {
    const wrapper = await mountWith({
      channel: {
        displayName: 'Cats',
        wikiEnabled: true,
        WikiHomePage: hasHomePage ? homePage : null,
        PinnedWikiPages: [],
      },
      wikiPages: hasHomePage ? [homePage] : [],
      stubs: { RequireAuth: { template: '<div><slot name="has-auth" /></div>' } },
    });
    await wrapper
      .findAllComponents(GenericButton)
      .find((button) => button.props('text') === buttonText)
      ?.vm.$emit('click');

    expect(testState.routerPush).toHaveBeenCalledWith(expectedRoute);
  });

  it('does not route an edit action while the user is suspended', async () => {
    testState.activeSuspension = { suspendedIndefinitely: true };
    const wrapper = await mountWith({
      stubs: { RequireAuth: { template: '<div><slot name="has-auth" /></div>' } },
    });
    await wrapper
      .findAllComponents(GenericButton)
      .find((button) => button.props('text') === 'Edit introduction')
      ?.vm.$emit('click');

    expect(testState.routerPush).not.toHaveBeenCalled();
  });

  it('applies SEO metadata when the channel query completes', async () => {
    await mountWith();
    testState.onChannelResult?.({
      data: { channels: [{ WikiHomePage: { title: 'Home' } }] },
    });

    expect(testState.useHead).toHaveBeenCalledOnce();
  });
});

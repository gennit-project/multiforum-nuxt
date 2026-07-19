import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import type { ComputedRef } from 'vue';
import { mount } from '@vue/test-utils';
import ForumQuickSwitcher from '@/components/nav/ForumQuickSwitcher.vue';

const h = vi.hoisted(() => ({
  username: null as unknown as ReturnType<typeof ref<string>>,
  routerPush: vi.fn(),
  getRecentForums: vi.fn(),
  queryCall: 0,
  enabled: [] as Array<ComputedRef<boolean>>,
  variables: [] as Array<ComputedRef<Record<string, unknown>>>,
  channelsResult: null as unknown as ReturnType<
    typeof ref<Record<string, unknown>>
  >,
  favoritesResult: null as unknown as ReturnType<
    typeof ref<Record<string, unknown>>
  >,
  collectionsResult: null as unknown as ReturnType<
    typeof ref<Record<string, unknown>>
  >,
}));

vi.mock('@floating-ui/vue', () => ({
  autoUpdate: vi.fn(),
  flip: vi.fn(),
  offset: vi.fn(),
  shift: vi.fn(),
  useFloating: () => ({ floatingStyles: ref({}) }),
}));

vi.mock('nuxt/app', () => ({
  useRouter: () => ({ push: h.routerPush }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => h.username,
}));

vi.mock('@/utils/localStorageUtils', () => ({
  getLocalStorageItem: h.getRecentForums,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: (
    _query: unknown,
    variables: ComputedRef<Record<string, unknown>>,
    options: { enabled: ComputedRef<boolean> }
  ) => {
    const call = h.queryCall++;
    h.variables.push(variables);
    h.enabled.push(options.enabled);
    return {
      result: [h.channelsResult, h.favoritesResult, h.collectionsResult][call],
      loading: ref(false),
    };
  },
}));

const SearchBarStub = defineComponent({
  name: 'SearchBar',
  emits: ['updateSearchInput', 'submit'],
  methods: { focus() {} },
  template:
    '<input data-testid="search-stub" @input="$emit(\'updateSearchInput\', $event.target.value)" />',
});

const mountSwitcher = () =>
  mount(ForumQuickSwitcher, {
    props: { currentForumId: 'cats' },
    attachTo: document.body,
    global: {
      stubs: {
        AvatarComponent: true,
        ChevronDownIcon: true,
        SearchBar: SearchBarStub,
      },
    },
  });

beforeEach(() => {
  h.username = ref('alice');
  h.routerPush.mockReset();
  h.routerPush.mockResolvedValue(undefined);
  h.getRecentForums.mockReset();
  h.getRecentForums.mockReturnValue([]);
  h.queryCall = 0;
  h.enabled = [];
  h.variables = [];
  h.channelsResult = ref({ channels: [] });
  h.favoritesResult = ref({ users: [] });
  h.collectionsResult = ref({ users: [] });
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ForumQuickSwitcher lazy loading', () => {
  it('keeps the forum popover out of the initial render', () => {
    mountSwitcher();

    expect(
      document.querySelector('[data-testid="forum-quick-switcher"]')
    ).toBeNull();
  });

  it('does not read recent forums during the initial render', () => {
    mountSwitcher();

    expect(h.getRecentForums).not.toHaveBeenCalled();
  });

  it('disables all queries before the switcher opens', () => {
    mountSwitcher();

    expect(h.enabled.map((enabled) => enabled.value)).toEqual([
      false,
      false,
      false,
    ]);
  });

  it('enables all queries for an authenticated user after opening', async () => {
    const wrapper = mountSwitcher();

    await wrapper
      .get('[data-testid="forum-quick-switcher-trigger"]')
      .trigger('click');

    expect(h.enabled.map((enabled) => enabled.value)).toEqual([
      true,
      true,
      true,
    ]);
  });

  it('reads recent forums only when the switcher opens', async () => {
    const wrapper = mountSwitcher();

    await wrapper
      .get('[data-testid="forum-quick-switcher-trigger"]')
      .trigger('click');

    expect(h.getRecentForums).toHaveBeenCalledWith('recentForums', []);
  });

  it('keeps account-specific queries disabled for a signed-out user', async () => {
    h.username.value = '';
    const wrapper = mountSwitcher();

    await wrapper
      .get('[data-testid="forum-quick-switcher-trigger"]')
      .trigger('click');

    expect(h.enabled.map((enabled) => enabled.value)).toEqual([
      true,
      false,
      false,
    ]);
  });
});

describe('ForumQuickSwitcher content', () => {
  it('shows recent, favorite, collection, and top-forum sections', async () => {
    h.getRecentForums.mockReturnValue([
      { uniqueName: 'recent', displayName: 'Recent Forum', timestamp: 2 },
    ]);
    h.channelsResult.value = {
      channels: [{ uniqueName: 'top', displayName: 'Top Forum' }],
    };
    h.favoritesResult.value = {
      users: [
        {
          FavoriteChannels: [
            { uniqueName: 'favorite', displayName: 'Favorite Forum' },
          ],
        },
      ],
    };
    h.collectionsResult.value = {
      users: [
        {
          Collections: [
            {
              id: 'list-1',
              name: 'My Forums',
              Channels: [{ uniqueName: 'listed', displayName: 'Listed Forum' }],
            },
          ],
        },
      ],
    };
    const wrapper = mountSwitcher();

    await wrapper
      .get('[data-testid="forum-quick-switcher-trigger"]')
      .trigger('click');

    expect(document.body.textContent).toEqual(
      expect.stringContaining('Recent forums')
    );
  });

  it('renders data from each forum source', async () => {
    h.getRecentForums.mockReturnValue([
      { uniqueName: 'recent', displayName: 'Recent Forum', timestamp: 2 },
    ]);
    h.channelsResult.value = {
      channels: [{ uniqueName: 'top', displayName: 'Top Forum' }],
    };
    h.favoritesResult.value = {
      users: [
        {
          FavoriteChannels: [
            { uniqueName: 'favorite', displayName: 'Favorite Forum' },
          ],
        },
      ],
    };
    h.collectionsResult.value = {
      users: [
        {
          Collections: [
            {
              id: 'list-1',
              name: 'My Forums',
              Channels: [{ uniqueName: 'listed', displayName: 'Listed Forum' }],
            },
          ],
        },
      ],
    };
    const wrapper = mountSwitcher();

    await wrapper
      .get('[data-testid="forum-quick-switcher-trigger"]')
      .trigger('click');

    expect(document.body.textContent).toEqual(
      expect.stringMatching(
        /Recent Forum.*Favorite Forum.*My Forums.*Top Forum/s
      )
    );
  });

  it('expands a forum collection', async () => {
    h.collectionsResult.value = {
      users: [
        {
          Collections: [
            {
              id: 'list-1',
              name: 'My Forums',
              Channels: [{ uniqueName: 'listed', displayName: 'Listed Forum' }],
            },
          ],
        },
      ],
    };
    const wrapper = mountSwitcher();
    await wrapper
      .get('[data-testid="forum-quick-switcher-trigger"]')
      .trigger('click');

    const collectionButton = Array.from(
      document.querySelectorAll('button')
    ).find((button) =>
      button.textContent?.includes('My Forums')
    ) as HTMLButtonElement;
    collectionButton.click();
    await nextTick();

    expect(document.body.textContent).toContain('Listed Forum');
  });

  it('updates the all-forums query from the search input', async () => {
    const wrapper = mountSwitcher();
    await wrapper
      .get('[data-testid="forum-quick-switcher-trigger"]')
      .trigger('click');

    const input = document.querySelector(
      '[data-testid="search-stub"]'
    ) as HTMLInputElement;
    input.value = 'cats';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    expect(h.variables[0].value).toEqual({
      channelWhere: { uniqueName_MATCHES: '(?i).*cats.*' },
    });
  });

  it('navigates immediately when a forum is selected', async () => {
    h.channelsResult.value = {
      channels: [{ uniqueName: 'dogs', displayName: 'Dogs' }],
    };
    const wrapper = mountSwitcher();
    await wrapper
      .get('[data-testid="forum-quick-switcher-trigger"]')
      .trigger('click');

    (
      document.querySelector(
        '[data-testid="forum-quick-switcher-option-dogs"]'
      ) as HTMLButtonElement
    ).click();
    await nextTick();

    expect(h.routerPush).toHaveBeenCalledWith({
      name: 'forums-forumId-discussions',
      params: { forumId: 'dogs' },
    });
  });
});

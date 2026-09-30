import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h as createEl } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import LibraryPage from './library.vue';

const h = vi.hoisted(() => ({
  counts: null as unknown as { value: unknown },
  owned: null as unknown as { value: unknown },
  uploaded: null as unknown as { value: unknown },
  collections: null as unknown as { value: unknown },
  route: { path: '/library', params: {} as Record<string, unknown> },
  qi: 0,
  username: null as unknown as { value: string },
  authenticated: null as unknown as { value: boolean },
  refetches: [] as ReturnType<typeof vi.fn>[],
  queryInputs: [] as unknown[],
}));

vi.mock('nuxt/app', async () => {
  const { reactive } = await import('vue');
  h.route = reactive(h.route);
  return { useHead: vi.fn(), useRoute: () => h.route };
});

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.counts = ref(null);
  h.owned = ref(null);
  h.uploaded = ref(null);
  h.collections = ref(null);
  const order = [h.counts, h.owned, h.uploaded, h.collections];
  return {
    useQuery: (
      _document: unknown,
      variables?: () => unknown,
      options?: () => unknown
    ) => {
      h.queryInputs.push([variables?.(), options?.()]);
      const refetch = vi.fn();
      h.refetches.push(refetch);
      return { result: order[h.qi++] ?? ref(null), refetch };
    },
  };
});

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  h.username = ref('alice');
  h.authenticated = ref(true);
  return {
    useUsername: () => h.username,
    useIsAuthenticated: () => h.authenticated,
  };
});

const RequireAuthUnauth = defineComponent({
  name: 'RequireAuth',
  setup(_props, { slots }) {
    return () => createEl('div', slots['does-not-have-auth']?.());
  },
});

const mountLibrary = (extraStubs: Record<string, unknown> = {}) =>
  mountWithDefaults(LibraryPage, {
    global: {
      stubs: { NuxtPage: true, ...extraStubs },
    },
  });

const setData = (
  params: {
    channels?: number;
    discussions?: number;
    images?: number;
    comments?: number;
    downloads?: number;
    ownedDownloads?: number;
    uploadedFiles?: number;
    collections?: unknown[];
  } = {}
) => {
  h.counts.value = {
    users: [
      {
        FavoriteChannelsConnection: { totalCount: params.channels || 0 },
        FavoriteDiscussionsConnection: {
          totalCount: params.discussions || 0,
        },
        FavoriteImagesConnection: { totalCount: params.images || 0 },
        FavoriteCommentsConnection: { totalCount: params.comments || 0 },
        FavoriteDownloadsConnection: { totalCount: params.downloads || 0 },
      },
    ],
  };
  h.owned.value = {
    users: [{ OwnedDownloadsAggregate: { count: params.ownedDownloads || 0 } }],
  };
  h.uploaded.value = {
    getUploadedDownloadableFiles: params.uploadedFiles
      ? [
          {
            files: Array.from({ length: params.uploadedFiles }, (_, id) => ({
              id,
            })),
          },
        ]
      : [],
  };
  h.collections.value = { users: [{ Collections: params.collections || [] }] };
};

beforeEach(() => {
  vi.clearAllMocks();
  h.qi = 0;
  h.refetches = [];
  h.queryInputs = [];
  h.route.path = '/library';
  h.route.params = {};
  h.counts.value = null;
  h.owned.value = null;
  h.uploaded.value = null;
  h.collections.value = null;
  h.username.value = 'alice';
  h.authenticated.value = true;
});

describe('Library page', () => {
  it('prompts unauthenticated users to sign in', () => {
    expect(mountLibrary({ RequireAuth: RequireAuthUnauth }).text()).toContain(
      'Sign In Required'
    );
  });

  it('combines every favorite type into one library entry', () => {
    setData({
      channels: 3,
      discussions: 1,
      images: 2,
      comments: 4,
      downloads: 2,
    });
    expect(
      mountLibrary().get('[data-testid="library-item-all-favorites"]').text()
    ).toContain('12 saved');
  });

  it('renders compact custom collection rows', () => {
    setData({
      collections: [
        {
          id: 'c1',
          name: 'My Reading List',
          collectionType: 'DISCUSSIONS',
          visibility: 'PRIVATE',
          itemCount: 4,
        },
      ],
    });
    expect(
      mountLibrary().get('[data-testid="library-item-c1"]').text()
    ).toContain('discussions · 4 · private');
  });

  it('uses the compact library search placeholder', () => {
    setData();
    expect(
      mountLibrary()
        .get('input[aria-label="Search library collections"]')
        .attributes('placeholder')
    ).toBe('Search your library');
  });

  it('uses the auto-saved collection count for My Downloads', () => {
    setData({
      collections: [
        {
          id: 'downloads-1',
          name: 'Downloaded Items',
          description:
            'Items appear here automatically when you download them.',
          collectionType: 'DOWNLOADS',
          visibility: 'PRIVATE',
          itemCount: 7,
        },
      ],
    });
    expect(
      mountLibrary().get('[data-testid="library-item-my-downloads"]').text()
    ).toContain('Downloads · 7');
  });

  it('filters the sidebar to image collections', async () => {
    setData({
      collections: [
        {
          id: 'images',
          name: 'Screenshots',
          collectionType: 'IMAGES',
          visibility: 'PRIVATE',
          itemCount: 2,
        },
        {
          id: 'posts',
          name: 'Reading',
          collectionType: 'DISCUSSIONS',
          visibility: 'PRIVATE',
          itemCount: 3,
        },
      ],
    });
    const wrapper = mountLibrary();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Images')!
      .trigger('click');
    expect(wrapper.find('[data-testid="library-item-posts"]').exists()).toBe(
      false
    );
  });

  it('filters the sidebar by search term', async () => {
    setData({
      collections: [
        {
          id: 'c1',
          name: 'My Reading List',
          collectionType: 'DISCUSSIONS',
          visibility: 'PRIVATE',
          itemCount: 4,
        },
      ],
    });
    const wrapper = mountLibrary();
    await wrapper
      .get('input[aria-label="Search library collections"]')
      .setValue('missing');
    expect(wrapper.text()).toContain('No library items match “missing”.');
  });

  it('marks legacy favorite routes as the unified favorites entry', () => {
    setData({ channels: 1 });
    h.route.path = '/library/favorite-channels';
    expect(
      mountLibrary().get('[data-testid="library-item-all-favorites"]').classes()
    ).toContain('bg-brand-50');
  });

  it('opens the mobile library list', async () => {
    setData();
    const wrapper = mountLibrary();
    await wrapper
      .get('[data-testid="mobile-library-nav-dropdown"]')
      .trigger('click');
    expect(wrapper.get('#mobile-library-list').classes()).toContain('block');
  });

  it('closes the mobile library list when the route changes', async () => {
    setData();
    const wrapper = mountLibrary();
    await wrapper
      .get('[data-testid="mobile-library-nav-dropdown"]')
      .trigger('click');
    h.route.path = '/library/uploads';
    await wrapper.vm.$nextTick();
    expect(
      wrapper
        .get('[data-testid="mobile-library-nav-dropdown"]')
        .attributes('aria-expanded')
    ).toBe('false');
  });

  it('counts every uploaded file across discussion groups', () => {
    setData({ uploadedFiles: 3 });
    expect(
      mountLibrary().get('[data-testid="library-item-uploaded-files"]').text()
    ).toContain('Files · 3');
  });

  it('enables each library query for the signed-in username', () => {
    setData();
    mountLibrary();
    expect(h.queryInputs).toEqual(
      Array.from({ length: 4 }, () => [
        { username: 'alice' },
        { enabled: true, fetchPolicy: 'cache-and-network' },
      ])
    );
  });

  it('refetches every library query when the username changes', async () => {
    setData();
    const wrapper = mountLibrary();
    h.username.value = 'bob';
    await wrapper.vm.$nextTick();
    expect(h.refetches.map((refetch) => refetch.mock.calls.length)).toEqual([
      1, 1, 1, 1,
    ]);
  });
});

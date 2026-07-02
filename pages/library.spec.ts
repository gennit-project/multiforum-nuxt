import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent, h as createEl } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import LibraryPage from './library.vue';

const h = vi.hoisted(() => ({
  counts: null as unknown as { value: unknown },
  downloads: null as unknown as { value: unknown },
  owned: null as unknown as { value: unknown },
  collections: null as unknown as { value: unknown },
  route: { path: '/library', params: {} as Record<string, unknown> },
  qi: 0,
}));

vi.mock('nuxt/app', () => ({
  useHead: vi.fn(),
  useRoute: () => h.route,
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.counts = ref(null);
  h.downloads = ref(null);
  h.owned = ref(null);
  h.collections = ref(null);
  const order = [h.counts, h.downloads, h.owned, h.collections];
  return {
    useQuery: () => ({ result: order[h.qi++] ?? ref(null), refetch: vi.fn() }),
  };
});

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return {
    useUsername: () => ref('alice'),
    useIsAuthenticated: () => ref(true),
  };
});

const RequireAuthUnauth = defineComponent({
  name: 'RequireAuth',
  setup(_p, { slots }) {
    return () => createEl('div', slots['does-not-have-auth']?.());
  },
});

const mountLibrary = (extraStubs: Record<string, unknown> = {}) =>
  mountWithDefaults(LibraryPage, {
    global: {
      mocks: {
        $route: { query: {}, params: {}, path: '/library', fullPath: '/library' },
      },
      stubs: { NuxtPage: true, ...extraStubs },
    },
  });

const setCounts = (channels: number, discussions: number, images: number) => {
  h.counts.value = {
    users: [
      {
        FavoriteChannelsAggregate: { count: channels },
        FavoriteDiscussionsAggregate: { count: discussions },
        FavoriteImagesAggregate: { count: images },
        FavoriteCommentsAggregate: { count: 0 },
      },
    ],
  };
  h.downloads.value = { users: [{ FavoriteDiscussionsAggregate: { count: 0 } }] };
  h.owned.value = { users: [{ OwnedDownloadsAggregate: { count: 0 } }] };
  h.collections.value = { users: [{ Collections: [] }] };
};

beforeEach(() => {
  vi.clearAllMocks();
  h.qi = 0;
  h.route.path = '/library';
  h.route.params = {};
  h.counts.value = null;
  h.downloads.value = null;
  h.owned.value = null;
  h.collections.value = null;
});

describe('Library page', () => {
  it('prompts unauthenticated users to sign in', () => {
    const wrapper = mountLibrary({ RequireAuth: RequireAuthUnauth });
    expect(wrapper.text()).toContain('Sign In Required');
  });

  it('renders the favorite collections with their counts', () => {
    setCounts(3, 1, 2);
    const wrapper = mountLibrary();
    // The count parens distinguish collection cards from the filter buttons.
    expect(wrapper.text()).toContain('(3)'); // favorite forums
    expect(wrapper.text()).toContain('(2)'); // favorite images
  });

  it('renders custom collections from the query', () => {
    setCounts(0, 0, 0);
    h.collections.value = {
      users: [
        {
          Collections: [
            {
              id: 'c1',
              name: 'My Reading List',
              description: 'stuff to read',
              collectionType: 'DISCUSSIONS',
              visibility: 'PRIVATE',
              itemCount: 4,
            },
          ],
        },
      ],
    };
    expect(mountLibrary().text()).toContain('My Reading List');
  });

  it('renders the collection search input', () => {
    setCounts(0, 0, 0);
    const wrapper = mountLibrary();
    expect(
      wrapper.get('input[aria-label="Search library collections"]').attributes(
        'placeholder'
      )
    ).toBe('Search collections');
  });

  it('filters collections by type', async () => {
    setCounts(3, 1, 2);
    const wrapper = mountLibrary();
    expect(wrapper.text()).toContain('(3)'); // forums shown under "all"

    const imagesFilter = wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'Images');
    await imagesFilter!.trigger('click');

    // Only the images favorite remains; the forums card (3) is filtered out.
    expect(wrapper.text()).toContain('(2)');
    expect(wrapper.text()).not.toContain('(3)');
  });

  it('filters collections by search term', async () => {
    setCounts(0, 0, 0);
    h.collections.value = {
      users: [
        {
          Collections: [
            {
              id: 'c1',
              name: 'My Reading List',
              description: 'stuff to read',
              collectionType: 'DISCUSSIONS',
              visibility: 'PRIVATE',
              itemCount: 4,
            },
          ],
        },
      ],
    };

    const wrapper = mountLibrary();
    await wrapper
      .get('input[aria-label="Search library collections"]')
      .setValue('reading');

    expect(wrapper.text()).toContain('My Reading List');
    await wrapper
      .get('input[aria-label="Search library collections"]')
      .setValue('missing');
    expect(wrapper.text()).toContain('No collections match "missing".');
  });

  it('marks a favorite collection route as active in the sidebar', () => {
    setCounts(3, 1, 2);
    h.route.path = '/library/favorite-channels';

    const wrapper = mountLibrary();
    const favoriteForumsLink = wrapper
      .findAll('a')
      .find((link) => link.attributes('href') === '/library/favorite-channels');

    expect(favoriteForumsLink?.classes().join(' ')).toContain('bg-orange-100');
  });
});

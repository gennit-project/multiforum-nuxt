import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery } from '@vue/apollo-composable';

vi.mock('nuxt/app', () => ({ useHead: vi.fn() }));

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({ serverAdminUsernames: ref([]) }),
}));

const RequireAuthStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots['has-auth']?.());
  },
});

const LibraryDownloadCardStub = defineComponent({
  name: 'LibraryDownloadCard',
  props: {
    download: {
      type: Object,
      required: true,
    },
  },
  template: '<div>{{ download.title }}</div>',
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

const mountWith = async (input: {
  collection?: unknown;
  collectionDownloads?: unknown[];
  ownedDownloads?: unknown[];
}) => {
  mockedUseQuery
    .mockReturnValueOnce({
      result: ref({
        users: [
          {
            Collections: input.collection ? [input.collection] : [],
          },
        ],
      }),
      loading: ref(false),
      error: ref(null),
    })
    .mockReturnValueOnce({
      result: ref({
        collections: input.collection
          ? [{ Downloads: input.collectionDownloads || [] }]
          : [],
      }),
      loading: ref(false),
      error: ref(null),
    })
    .mockReturnValueOnce({
      result: ref({ users: [{ OwnedDownloads: input.ownedDownloads || [] }] }),
      loading: ref(false),
      error: ref(null),
    });
  const Page = (await import('./my-downloads.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        RequireAuth: RequireAuthStub,
        NuxtLink: { template: '<a><slot /></a>' },
        LibraryDownloadCard: LibraryDownloadCardStub,
      },
    },
  });
};

describe('my downloads page', () => {
  it('shows the empty state when there are no downloads in the auto-saved collection', async () => {
    expect(
      (
        await mountWith({
          collection: {
            id: 'downloads-1',
            name: 'Downloaded Items',
            collectionType: 'DOWNLOADS',
          },
          collectionDownloads: [],
        })
      ).text()
    ).toContain('No downloads yet');
  });

  it('renders downloads from the auto-saved collection when present', async () => {
    const wrapper = await mountWith({
      collection: {
        id: 'downloads-1',
        name: 'Downloaded Items',
        collectionType: 'DOWNLOADS',
      },
      collectionDownloads: [
        {
          id: 'd1',
          title: 'My tileset',
          DiscussionChannels: [{ channelUniqueName: 'cats' }],
          Tags: [],
        },
      ],
      ownedDownloads: [],
    });
    expect(wrapper.text()).toContain('My tileset');
    expect(wrapper.text()).toContain('Saved in your private');
  });

  it('falls back to legacy owned downloads when the auto-saved collection does not exist', async () => {
    const wrapper = await mountWith({
      ownedDownloads: [
        {
          id: 'd2',
          title: 'Legacy download',
          DiscussionChannels: [{ channelUniqueName: 'cats' }],
          Tags: [],
        },
      ],
    });

    expect(wrapper.text()).toContain('Legacy download');
  });
});

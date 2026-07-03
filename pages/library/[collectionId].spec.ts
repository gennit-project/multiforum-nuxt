import { beforeEach, describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
vi.mock('nuxt/app', () => ({ useHead: vi.fn() }));

const h = vi.hoisted(() => ({
  routerPush: undefined as unknown as ReturnType<typeof vi.fn>,
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { collectionId: 'col-1' } }),
  useRouter: () => ({ push: h.routerPush }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({ serverAdminUsernames: ref([]) }),
}));

const RequireAuthStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.() ?? slots['has-auth']?.());
  },
});

const LibraryCommentCardStub = defineComponent({
  name: 'LibraryCommentCard',
  props: {
    comment: {
      type: Object,
      required: true,
    },
    contextType: {
      type: String,
      required: true,
    },
  },
  template: '<div>{{ comment.text }} {{ contextType }}</div>',
});

const LibraryDiscussionCardStub = defineComponent({
  name: 'LibraryDiscussionCard',
  props: {
    discussion: {
      type: Object,
      required: true,
    },
  },
  template:
    '<article data-testid="discussion-card">{{ discussion.id }} {{ discussion.title }}</article>',
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;
const mockedUseMutation = useMutation as unknown as ReturnType<typeof vi.fn>;
const mutationMocks = {
  update: vi.fn(),
  delete: vi.fn(),
  reorder: vi.fn(),
  share: vi.fn(),
};
let refetchCollection = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  h.routerPush = vi.fn();
});

const mountWith = async (collection: unknown) => {
  refetchCollection = vi.fn();
  mutationMocks.update.mockResolvedValue({});
  mutationMocks.delete.mockResolvedValue({});
  mutationMocks.reorder.mockResolvedValue({});
  mutationMocks.share.mockResolvedValue({
    data: {
      shareCollectionAsDiscussion: {
        id: 'discussion-1',
        DiscussionChannels: [{ channelUniqueName: 'sims4_builds' }],
      },
    },
  });
  mockedUseMutation
    .mockReturnValueOnce({
      mutate: mutationMocks.update,
      loading: ref(false),
      error: ref(null),
    })
    .mockReturnValueOnce({
      mutate: mutationMocks.delete,
      loading: ref(false),
      error: ref(null),
    })
    .mockReturnValueOnce({
      mutate: mutationMocks.reorder,
      loading: ref(false),
      error: ref(null),
    })
    .mockReturnValueOnce({
      mutate: mutationMocks.share,
      loading: ref(false),
      error: ref(null),
    });
  mockedUseQuery.mockReturnValue({
    result: ref({ collections: collection ? [collection] : [] }),
    loading: ref(false),
    error: ref(null),
    refetch: refetchCollection,
  });
  const Page = (await import('./[collectionId].vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        RequireAuth: RequireAuthStub,
        NuxtLink: { template: '<a><slot /></a>' },
        LibraryDownloadCard: true,
        LibraryDiscussionCard: LibraryDiscussionCardStub,
        LibraryChannelCard: true,
        LibraryCommentCard: LibraryCommentCardStub,
        ImageListItem: true,
        ForumPicker: {
          name: 'ForumPicker',
          props: ['selectedChannels'],
          emits: ['setSelectedChannels'],
          template:
            '<button data-testid="forum-picker" @click="$emit(\'setSelectedChannels\', [\'sims4_builds\'])">pick forum</button>',
        },
        GenericModal: {
          name: 'GenericModal',
          props: [
            'open',
            'title',
            'primaryButtonDisabled',
          ],
          emits: ['primary-button-click', 'close'],
          template:
            '<section v-if="open" :data-title="title"><slot name="content" /><button data-testid="modal-primary" :disabled="primaryButtonDisabled" @click="$emit(\'primary-button-click\')">primary</button></section>',
        },
        Breadcrumbs: {
          props: ['links'],
          template: '<nav>{{ links.map((link) => link.label).join(" > ") }}</nav>',
        },
      },
    },
  });
};

describe('library collection detail page', () => {
  it('shows the collection name when it loads', async () => {
    const wrapper = await mountWith({
      id: 'col-1',
      name: 'Cat GIFs',
      collectionType: 'DISCUSSIONS',
      visibility: 'PUBLIC',
      Discussions: [],
      itemCount: 0,
    });
    expect(wrapper.text()).toContain('Cat GIFs');
  });

  it('renders the library breadcrumb trail', async () => {
    const wrapper = await mountWith({
      id: 'col-1',
      name: 'Cat GIFs',
      collectionType: 'DISCUSSIONS',
      visibility: 'PUBLIC',
      Discussions: [],
      itemCount: 0,
    });

    expect(wrapper.text()).toContain('Custom Collections');
    expect(wrapper.text()).toContain('Cat GIFs');
  });

  it('explains that the auto-saved downloads collection is populated automatically', async () => {
    const wrapper = await mountWith({
      id: 'col-downloads',
      name: 'Downloaded Items',
      description: 'Items appear here automatically when you download them.',
      collectionType: 'DOWNLOADS',
      visibility: 'PRIVATE',
      Downloads: [],
      itemCount: 0,
    });

    expect(wrapper.text()).toContain(
      'Downloads are added to this private collection automatically when you grab a file.'
    );
  });

  it('shows disabled share copy for private collections', async () => {
    const wrapper = await mountWith({
      id: 'col-1',
      name: 'Private list',
      collectionType: 'DISCUSSIONS',
      visibility: 'PRIVATE',
      Discussions: [],
      itemCount: 0,
    });

    const shareButton = wrapper.find('button[title="Make this collection public before sharing it to a forum"]');
    expect(shareButton.exists()).toBe(true);
    expect(shareButton.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain(
      'Make this collection public before sharing it to a forum discussion.'
    );
  });

  it('shares a public collection to a selected forum', async () => {
    const wrapper = await mountWith({
      id: 'col-1',
      name: 'Public list',
      collectionType: 'DISCUSSIONS',
      visibility: 'PUBLIC',
      Discussions: [],
      itemCount: 0,
    });

    await wrapper
      .find('button[title="Share this public collection to a forum discussion"]')
      .trigger('click');
    await wrapper.find('[data-testid="forum-picker"]').trigger('click');
    await wrapper.find('[data-testid="modal-primary"]').trigger('click');

    expect(mutationMocks.share).toHaveBeenCalledWith({
      collectionId: 'col-1',
      serverId: 'sims4_builds',
      title: 'Shared collection: Public list',
      shareMessage: null,
    });
    expect(h.routerPush).toHaveBeenCalledWith(
      '/forums/sims4_builds/discussions/discussion-1'
    );
  });

  it('renders discussion collection items in stored order', async () => {
    const wrapper = await mountWith({
      id: 'col-1',
      name: 'Ordered discussions',
      collectionType: 'DISCUSSIONS',
      visibility: 'PRIVATE',
      itemCount: 2,
      itemOrder: ['d2', 'd1'],
      Discussions: [
        { id: 'd1', title: 'First saved', DiscussionChannels: [] },
        { id: 'd2', title: 'Second saved', DiscussionChannels: [] },
      ],
    });

    const cards = wrapper.findAll('[data-testid="discussion-card"]');
    expect(cards.map((card) => card.text().split(' ')[0])).toEqual([
      'd2',
      'd1',
    ]);
  });

  it('persists move down through the reorder mutation', async () => {
    const wrapper = await mountWith({
      id: 'col-1',
      name: 'Ordered discussions',
      collectionType: 'DISCUSSIONS',
      visibility: 'PRIVATE',
      itemCount: 2,
      itemOrder: ['d1', 'd2'],
      Discussions: [
        { id: 'd1', title: 'First saved', DiscussionChannels: [] },
        { id: 'd2', title: 'Second saved', DiscussionChannels: [] },
      ],
    });

    await wrapper
      .find('button[aria-label="Move First saved down"]')
      .trigger('click');

    expect(mutationMocks.reorder).toHaveBeenCalledWith({
      collectionId: 'col-1',
      itemId: 'd1',
      newPosition: 1,
    });
    expect(refetchCollection).toHaveBeenCalled();
  });

  const commentsCollection = {
    id: 'col-2',
    name: 'Saved comments',
    collectionType: 'COMMENTS',
    visibility: 'PRIVATE',
    itemCount: 1,
    Comments: [
      {
        id: 'c1',
        text: 'Look at this ![cat](https://example.com/cat.png)',
        createdAt: '2024-01-01T00:00:00Z',
        CommentAuthor: { __typename: 'User', username: 'bob' },
        DiscussionChannel: {
          channelUniqueName: 'cats',
          discussionId: 'd1',
          Discussion: { id: 'd1', title: 'Cats' },
        },
      },
    ],
  };

  // Regression: comment bodies in a COMMENTS collection must render via
  // MarkdownPreview so inline images open the lightbox, not the bare
  // MarkdownRenderer which cannot expand images.
  it('renders comment bodies via MarkdownPreview', async () => {
    const wrapper = await mountWith(commentsCollection);
    expect(wrapper.findComponent(LibraryCommentCardStub).props('comment')).toEqual(
      commentsCollection.Comments[0]
    );
  });

  it('enables the image lightbox for comment bodies', async () => {
    const wrapper = await mountWith(commentsCollection);
    expect(wrapper.findComponent(LibraryCommentCardStub).props('contextType')).toBe(
      'Discussion'
    );
  });
});

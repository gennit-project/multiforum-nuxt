import { beforeEach, describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
vi.mock('nuxt/app', () => ({ useHead: vi.fn() }));

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { collectionId: 'col-1' } }),
  useRouter: () => ({ push: vi.fn() }),
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
};
let refetchCollection = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

const mountWith = async (collection: unknown) => {
  refetchCollection = vi.fn();
  mutationMocks.update.mockResolvedValue({});
  mutationMocks.delete.mockResolvedValue({});
  mutationMocks.reorder.mockResolvedValue({});
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

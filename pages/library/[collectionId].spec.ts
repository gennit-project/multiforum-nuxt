import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref, defineComponent, h } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import MarkdownPreview from '@/components/MarkdownPreview.vue';

vi.mock('nuxt/app', () => ({ useHead: vi.fn() }));

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { collectionId: 'col-1' } }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: () => ({
    mutate: vi.fn(),
    loading: ref(false),
    error: ref(null),
    onDone: vi.fn(),
    onError: vi.fn(),
  }),
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

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (collection: unknown) => {
  mockedUseQuery.mockReturnValue({
    result: ref({ collections: collection ? [collection] : [] }),
    loading: ref(false),
    error: ref(null),
    refetch: vi.fn(),
  });
  const Page = (await import('./[collectionId].vue')).default;
  return shallowMount(Page, {
    global: { stubs: { RequireAuth: RequireAuthStub } },
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
    expect(wrapper.findComponent(MarkdownPreview).props('text')).toBe(
      commentsCollection.Comments[0].text
    );
  });

  it('enables the image lightbox for comment bodies', async () => {
    const wrapper = await mountWith(commentsCollection);
    expect(wrapper.findComponent(MarkdownPreview).props('disableGallery')).toBe(
      false
    );
  });
});

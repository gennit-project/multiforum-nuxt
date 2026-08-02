import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount, mount } from '@vue/test-utils';
import { ref, defineComponent, h, reactive } from 'vue';
import { useQuery } from '@vue/apollo-composable';

const routeQuery: Record<string, unknown> = reactive({});
const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn();
let fetchMore = vi.fn();

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ query: routeQuery }),
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    resolve: (r: unknown) => r,
  }),
  useHead: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const NuxtLayoutStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;

const mountWith = async (opts: {
  searchInput?: string;
  comments?: unknown[];
  count?: number;
  loading?: boolean;
  error?: Error | null;
}) => {
  routeQuery.searchInput = opts.searchInput;
  mockedUseQuery.mockReturnValue({
    result: ref({
      comments: opts.comments ?? [],
      commentsAggregate: { count: opts.count ?? 0 },
    }),
    loading: ref(opts.loading ?? false),
    error: ref(opts.error ?? null),
    fetchMore,
  });
  const Page = (await import('./search.vue')).default;
  return shallowMount(Page, {
    global: {
      stubs: {
        NuxtLayout: NuxtLayoutStub,
        SearchBar: {
          name: 'SearchBar',
          emits: ['update-search-input'],
          template: '<div />',
        },
        FilterChip: {
          name: 'FilterChip',
          template: '<div><slot name="content" /></div>',
        },
        SearchableForumList: {
          name: 'SearchableForumList',
          emits: ['toggle-selection'],
          template: '<div />',
        },
        LoadMore: {
          name: 'LoadMore',
          emits: ['load-more'],
          template: '<div />',
        },
      },
    },
  });
};

beforeEach(() => {
  mockRouterPush.mockClear();
  mockRouterReplace.mockClear();
  fetchMore = vi.fn();
  for (const key of Object.keys(routeQuery)) {
    Reflect.deleteProperty(routeQuery, key);
  }
});

describe('comment search page', () => {
  it('prompts for a search term when the input is empty', async () => {
    const wrapper = await mountWith({ searchInput: '' });
    expect(wrapper.text()).toContain('Enter a search term to find comments.');
  });

  it('shows the total result count for a search', async () => {
    const wrapper = await mountWith({
      searchInput: 'hello',
      comments: [{ id: 'c1' }],
      count: 1,
    });
    expect(wrapper.text()).toContain('1 comment found');
  });

  it('shows a no-results message when nothing matches', async () => {
    const wrapper = await mountWith({
      searchInput: 'zzz',
      comments: [],
      count: 0,
    });
    expect(wrapper.text()).toContain('No comments match your search.');
  });

  it('shows loading and error query states', async () => {
    const loading = await mountWith({ searchInput: 'hello', loading: true });
    const error = await mountWith({
      searchInput: 'hello',
      error: new Error('search failed'),
    });
    expect({ loading: loading.text(), error: error.text() }).toEqual({
      loading: expect.stringContaining('Searching...'),
      error: expect.stringContaining('search failed'),
    });
  });

  it('updates search and channel filters from their controls', async () => {
    const wrapper = await mountWith({ searchInput: 'hello' });
    await wrapper
      .findComponent({ name: 'SearchBar' })
      .vm.$emit('update-search-input', 'updated');
    await wrapper
      .findComponent({ name: 'SearchableForumList' })
      .vm.$emit('toggle-selection', 'cats');
    expect(mockRouterReplace.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('adds and removes a selected forum filter', async () => {
    routeQuery.channels = ['cats'];
    const wrapper = await mountWith({ searchInput: 'hello' });
    const forums = wrapper.findComponent({ name: 'SearchableForumList' });
    await forums.vm.$emit('toggle-selection', 'cats');
    await forums.vm.$emit('toggle-selection', 'dogs');
    expect(mockRouterReplace).toHaveBeenCalled();
  });

  it('loads and merges the next page of comments', async () => {
    const wrapper = await mountWith({
      searchInput: 'hello',
      comments: [{ id: 'c1' }],
      count: 2,
    });
    await wrapper.findComponent({ name: 'LoadMore' }).vm.$emit('load-more');
    const options = fetchMore.mock.calls[0][0];
    expect(
      options.updateQuery(
        { comments: [{ id: 'c1' }] },
        { fetchMoreResult: { comments: [{ id: 'c2' }] } }
      ).comments
    ).toEqual([{ id: 'c1' }, { id: 'c2' }]);
  });

  it('keeps the current page when loading more returns no result', async () => {
    const previous = { comments: [{ id: 'c1' }] };
    const wrapper = await mountWith({
      searchInput: 'hello',
      comments: previous.comments,
      count: 2,
    });
    await wrapper.findComponent({ name: 'LoadMore' }).vm.$emit('load-more');
    expect(
      fetchMore.mock.calls[0][0].updateQuery(previous, {
        fetchMoreResult: null,
      })
    ).toBe(previous);
  });
});

// A search result card is itself a permalink: clicking the card navigates to the
// matched comment, while the nested author/context/"View comment" links use
// @click.stop so they reach their own destinations instead of the comment
// permalink. These tests cover that interaction (previously manual-only).
describe('comment search result navigation', () => {
  const discussionComment = {
    id: 'comment-1',
    text: 'a matching comment',
    createdAt: '2026-01-01T00:00:00.000Z',
    CommentAuthor: {
      __typename: 'User',
      username: 'bob',
      displayName: 'Bob',
      profilePicURL: '',
    },
    DiscussionChannel: {
      channelUniqueName: 'cats',
      discussionId: 'discussion-1',
      Discussion: { title: 'Great topic' },
    },
  };

  const RouterLinkStub = { props: ['to'], template: '<a><slot /></a>' };
  const passthrough = (tag = 'div') => ({
    template: `<${tag}><slot /></${tag}>`,
  });

  const mountResults = async () => {
    routeQuery.searchInput = 'matching';
    mockedUseQuery.mockReturnValue({
      result: ref({
        comments: [discussionComment],
        commentsAggregate: { count: 1 },
      }),
      loading: ref(false),
      error: ref(null),
      fetchMore: vi.fn(),
    });
    const Page = (await import('./search.vue')).default;
    return mount(Page, {
      global: {
        stubs: {
          NuxtLayout: NuxtLayoutStub,
          RouterLink: RouterLinkStub,
          SearchBar: passthrough(),
          FilterChip: passthrough(),
          ChannelIcon: passthrough('span'),
          SearchableForumList: passthrough(),
          AvatarComponent: passthrough('span'),
          MarkdownPreview: passthrough(),
          LoadMore: passthrough(),
        },
      },
    });
  };

  it('navigates to the comment permalink when the card is clicked', async () => {
    const wrapper = await mountResults();

    await wrapper.get('[role="link"]').trigger('click');

    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'forums-forumId-discussions-discussionId-comments-commentId',
        params: expect.objectContaining({
          forumId: 'cats',
          discussionId: 'discussion-1',
          commentId: 'comment-1',
        }),
      })
    );
  });

  it('does not trigger card navigation when the author link is clicked', async () => {
    const wrapper = await mountResults();
    const authorLink = wrapper
      .findAll('a')
      .find((a) => a.text().includes('Bob'))!;

    await authorLink.trigger('click');

    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('does not trigger card navigation when the context link is clicked', async () => {
    const wrapper = await mountResults();
    const contextLink = wrapper
      .findAll('a')
      .find((a) => a.text().includes('Great topic'))!;

    await contextLink.trigger('click');

    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('does not trigger card navigation when the "View comment" link is clicked', async () => {
    const wrapper = await mountResults();
    const viewLink = wrapper
      .findAll('a')
      .find((a) => a.text().includes('View comment'))!;

    await viewLink.trigger('click');

    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it.each(['enter', 'space'])(
    'opens the result with the %s key',
    async (key) => {
      const wrapper = await mountResults();
      await wrapper.get('[role="link"]').trigger(`keydown.${key}`);
      expect(mockRouterPush).toHaveBeenCalled();
    }
  );
});

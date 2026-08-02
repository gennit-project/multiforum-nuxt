import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import Comment from '@/components/comments/Comment.vue';

const channelState = vi.hoisted(() => ({
  selectedChannels: { value: [] as string[] },
  hasSelectedChannels: { value: false },
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { username: 'alice' }, query: {} }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/composables/useSelectedChannelsFromQuery', () => ({
  useSelectedChannelsFromQuery: () => ({
    selectedChannels: channelState.selectedChannels,
    hasSelectedChannels: channelState.hasSelectedChannels,
  }),
}));

const mockedUseQuery = useQuery as unknown as ReturnType<typeof vi.fn>;
const fetchMore = vi.fn();

const mountWith = async (
  comments: unknown[],
  options: { loading?: boolean; error?: unknown; aggregateCount?: number } = {}
) => {
  fetchMore.mockReset();
  mockedUseQuery.mockReturnValue({
    result: ref({
      users: [
        {
          Comments: comments,
          CommentsAggregate: {
            count: options.aggregateCount ?? comments.length,
          },
        },
      ],
    }),
    loading: ref(options.loading ?? false),
    error: ref(options.error ?? null),
    fetchMore,
  });
  const Page = (await import('./comments.vue')).default;
  return shallowMount(Page);
};

describe('user comments page', () => {
  it('shows the empty message when the user has no comments', async () => {
    const wrapper = await mountWith([]);
    expect(wrapper.text()).toContain('No comments yet');
  });

  it('renders a Comment for each non-archived comment', async () => {
    const wrapper = await mountWith([
      {
        id: 'c1',
        archived: false,
        ParentComment: null,
        Event: {},
        DiscussionChannel: {},
      },
      {
        id: 'c2',
        archived: false,
        ParentComment: null,
        Event: {},
        DiscussionChannel: {},
      },
    ]);
    expect(wrapper.findAllComponents(Comment)).toHaveLength(2);
  });

  it('builds channel filters into the comments query', async () => {
    channelState.selectedChannels.value = ['cats', 'dogs'];
    channelState.hasSelectedChannels.value = true;
    await mountWith([]);
    const variables = mockedUseQuery.mock.calls.at(-1)?.[1]();

    expect(variables).toEqual({
      username: 'alice',
      limit: 25,
      offset: 0,
      where: {
        OR: [
          { Channel: { uniqueName_IN: ['cats', 'dogs'] } },
          { DiscussionChannel: { channelUniqueName_IN: ['cats', 'dogs'] } },
          {
            Event: {
              EventChannels_SOME: { channelUniqueName_IN: ['cats', 'dogs'] },
            },
          },
        ],
      },
    });
    channelState.selectedChannels.value = [];
    channelState.hasSelectedChannels.value = false;
  });

  it('marks comments from deleted events with a warning', async () => {
    const wrapper = await mountWith([
      {
        id: 'c1',
        archived: false,
        ParentComment: null,
        Event: null,
        DiscussionChannel: null,
      },
    ]);

    expect(wrapper.findComponent({ name: 'InfoBanner' }).props('text')).toBe(
      'This comment was on an event that has been deleted.'
    );
  });

  it('renders archived comments with their channel context', async () => {
    const wrapper = await mountWith([
      {
        id: 'c1',
        archived: true,
        Channel: { uniqueName: 'cats' },
        Event: {},
        DiscussionChannel: {},
      },
    ]);

    expect(
      wrapper.findComponent({ name: 'ArchivedCommentText' }).props()
    ).toMatchObject({ channelId: 'cats', commentId: 'c1' });
  });

  it('requests the next page of comments', async () => {
    const wrapper = await mountWith(
      [
        {
          id: 'c1',
          archived: false,
          ParentComment: null,
          Event: {},
          DiscussionChannel: {},
        },
      ],
      { aggregateCount: 2 }
    );

    wrapper.findComponent({ name: 'LoadMore' }).vm.$emit('load-more');

    expect(fetchMore).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          username: 'alice',
          limit: 25,
          offset: 1,
          where: undefined,
        },
      })
    );
  });

  it('merges a fetched page into the existing comments', async () => {
    const wrapper = await mountWith(
      [
        {
          id: 'c1',
          archived: false,
          ParentComment: null,
          Event: {},
          DiscussionChannel: {},
        },
      ],
      { aggregateCount: 2 }
    );
    wrapper.findComponent({ name: 'LoadMore' }).vm.$emit('load-more');
    const updateQuery = fetchMore.mock.calls[0][0].updateQuery;

    expect(
      updateQuery(
        { users: [{ Comments: [{ id: 'c1' }] }] },
        { fetchMoreResult: { users: [{ Comments: [{ id: 'c2' }] }] } }
      )
    ).toEqual({ users: [{ Comments: [{ id: 'c1' }, { id: 'c2' }] }] });
  });

  it('preserves the previous result when fetch-more returns nothing', async () => {
    const wrapper = await mountWith(
      [
        {
          id: 'c1',
          archived: false,
          ParentComment: null,
          Event: {},
          DiscussionChannel: {},
        },
      ],
      { aggregateCount: 2 }
    );
    wrapper.findComponent({ name: 'LoadMore' }).vm.$emit('load-more');
    const updateQuery = fetchMore.mock.calls[0][0].updateQuery;
    const previous = { users: [{ Comments: [{ id: 'c1' }] }] };

    expect(updateQuery(previous, { fetchMoreResult: null })).toBe(previous);
  });
});

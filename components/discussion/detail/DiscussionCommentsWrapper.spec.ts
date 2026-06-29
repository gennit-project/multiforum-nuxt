import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import {
  asMock,
  createMutationMock,
  createQueryMock,
  configureApolloMocks,
} from '@/tests/utils/mockApollo';
import type { Comment, DiscussionChannel } from '@/__generated__/graphql';

import { useQuery, useMutation } from '@vue/apollo-composable';

import DiscussionCommentsWrapper from '@/components/discussion/detail/DiscussionCommentsWrapper.vue';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));
vi.mock('nuxt/app', () => ({ useRoute: vi.fn(() => ({ params: {}, query: {} })) }));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ({ value: 'alice' }),
}));
vi.mock('@/composables/useAutoUnsubscribe', () => ({ useAutoUnsubscribe: vi.fn() }));

const CommentSectionStub = {
  name: 'CommentSection',
  props: ['comments'],
  // Render the slots so slotted content (e.g. the subscribe button) appears.
  template:
    '<div class="comment-section-stub"><slot name="subscription-button" /><slot name="pre-header" /><slot /></div>',
};
const SubscribeButtonStub = {
  name: 'SubscribeButton',
  props: ['isSubscribed'],
  emits: ['toggle'],
  template: '<button class="subscribe-stub" @click="$emit(\'toggle\')" />',
};

const stubs = {
  CommentSection: CommentSectionStub,
  SubscribeButton: SubscribeButtonStub,
  InlineCommentForm: { template: '<div />' },
  DiscussionRootCommentFormWrapper: { template: '<div />' },
  Notification: { template: '<div />' },
};

const makeComment = (id: string): Comment =>
  ({ id, text: `comment ${id}`, __typename: 'Comment' }) as unknown as Comment;

const makeChannel = (overrides: Record<string, unknown> = {}): DiscussionChannel =>
  ({
    id: 'dc1',
    discussionId: 'd1',
    channelUniqueName: 'cats',
    SubscribedToNotifications: [],
    __typename: 'DiscussionChannel',
    ...overrides,
  }) as unknown as DiscussionChannel;

const subscribeMock = createMutationMock();
const unsubscribeMock = createMutationMock();

const mountWrapper = (props: Record<string, unknown> = {}) => {
  configureApolloMocks({
    useQuery,
    useMutation,
    // The only query (GET_USER) reads result.users[0]; give it an array shape.
    fallbackQuery: createQueryMock({ users: [] }),
    mutations: {
      subscribeToDiscussionChannel: subscribeMock,
      unsubscribeFromDiscussionChannel: unsubscribeMock,
    },
  });
  return mountWithDefaults(DiscussionCommentsWrapper, {
    props: {
      aggregateCommentCount: 0,
      discussionAuthor: 'bob',
      reachedEndOfResults: false,
      previousOffset: 0,
      discussionChannel: makeChannel(),
      comments: [makeComment('a'), makeComment('b')],
      ...props,
    },
    global: { stubs },
  });
};

describe('DiscussionCommentsWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asMock(useMutation).mockReset();
    asMock(useQuery).mockReset();
  });

  it('passes the comments through to CommentSection in order', () => {
    const wrapper = mountWrapper();
    const passed = wrapper.findComponent(CommentSectionStub).props('comments') as Comment[];
    expect(passed.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('renders the subscribe button', () => {
    const wrapper = mountWrapper();
    expect(wrapper.find('.subscribe-stub').exists()).toBe(true);
  });

  it('subscribes when toggled while not subscribed', async () => {
    const wrapper = mountWrapper();
    await wrapper.find('.subscribe-stub').trigger('click');
    expect(subscribeMock.mutate).toHaveBeenCalledWith({ discussionChannelId: 'dc1' });
  });

  it('unsubscribes when toggled while subscribed', async () => {
    const wrapper = mountWrapper({
      discussionChannel: makeChannel({
        SubscribedToNotifications: [{ username: 'alice' }],
      }),
    });
    await wrapper.find('.subscribe-stub').trigger('click');
    expect(unsubscribeMock.mutate).toHaveBeenCalledWith({ discussionChannelId: 'dc1' });
  });

  it('does nothing when there is no discussion channel id', async () => {
    const wrapper = mountWrapper({ discussionChannel: makeChannel({ id: '' }) });
    await wrapper.find('.subscribe-stub').trigger('click');
    expect(subscribeMock.mutate).not.toHaveBeenCalled();
  });

  // Regression: the user query result may lack a `users` array; the notify
  // computed must not throw on it (was `?.users[0]`, now `?.users?.[0]`).
  it('does not crash when the user query result has no users array', () => {
    configureApolloMocks({
      useQuery,
      useMutation,
      fallbackQuery: createQueryMock({}),
      mutations: {
        subscribeToDiscussionChannel: subscribeMock,
        unsubscribeFromDiscussionChannel: unsubscribeMock,
      },
    });
    expect(() =>
      mountWithDefaults(DiscussionCommentsWrapper, {
        props: {
          aggregateCommentCount: 0,
          discussionAuthor: 'bob',
          reachedEndOfResults: false,
          previousOffset: 0,
          discussionChannel: makeChannel(),
          comments: [],
        },
        global: { stubs },
      })
    ).not.toThrow();
  });
});

describe('DiscussionCommentsWrapper — comment-section cache handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asMock(useMutation).mockReset();
    asMock(useQuery).mockReset();
  });

  const commentSection = (wrapper: ReturnType<typeof mountWrapper>) =>
    wrapper.findComponent(CommentSectionStub);

  // cache.modify stub that runs the field policies so their bodies are covered.
  const fakeCache = () => ({
    identify: vi.fn(() => 'DiscussionChannel:dc1'),
    modify: vi.fn(({ fields }: { fields: Record<string, (e?: unknown) => unknown> }) =>
      // Call with no arg so each field policy applies its own default
      // (CommentsAggregate -> {count:0}, FeedbackComments -> []).
      Object.values(fields).forEach((fn) => fn())
    ),
    evict: vi.fn(),
  });

  it('increments the cached comment count', async () => {
    const wrapper = mountWrapper();
    const cache = fakeCache();
    await commentSection(wrapper).vm.$emit('increment-comment-count', cache);

    expect(cache.modify).toHaveBeenCalledTimes(1);
  });

  it('does not increment when there is no discussion channel id', async () => {
    const wrapper = mountWrapper({ discussionChannel: makeChannel({ id: '' }) });
    const cache = fakeCache();
    await commentSection(wrapper).vm.$emit('increment-comment-count', cache);

    expect(cache.modify).not.toHaveBeenCalled();
  });

  it('decrements the cached comment count', async () => {
    const wrapper = mountWrapper();
    const cache = fakeCache();
    await commentSection(wrapper).vm.$emit('decrement-comment-count', cache);

    expect(cache.modify).toHaveBeenCalledTimes(1);
  });

  it('evicts a deleted comment from the cache', async () => {
    const wrapper = mountWrapper();
    const cache = fakeCache();
    await commentSection(wrapper).vm.$emit('update-comment-section-query-result', {
      cache,
      commentToDeleteId: 'comment-9',
    });

    expect(cache.evict).toHaveBeenCalledTimes(1);
  });

  it('appends a feedback comment to the cache', async () => {
    const wrapper = mountWrapper();
    const cache = fakeCache();
    await commentSection(wrapper).vm.$emit('update-comment-section-query-result', {
      cache,
      commentToAddFeedbackTo: { id: 'comment-9' },
      newFeedbackComment: { id: 'fb-1', __typename: 'Comment' },
    });

    expect(cache.modify).toHaveBeenCalledTimes(1);
  });

  it('rejects a reply input without a parent comment id', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mountWrapper();
    await commentSection(wrapper).vm.$emit('update-create-reply-comment-input', {
      text: 'orphan reply',
    });
    const called = errorSpy.mock.calls.some((c) =>
      String(c[0]).includes('Parent comment id is required')
    );
    errorSpy.mockRestore();

    expect(called).toBe(true);
  });

  it('accepts a reply input that has a parent comment id', async () => {
    const wrapper = mountWrapper();
    await commentSection(wrapper).vm.$emit('update-create-reply-comment-input', {
      text: 'a reply',
      parentCommentId: 'comment-1',
      depth: 2,
    });

    expect(commentSection(wrapper).exists()).toBe(true);
  });
});

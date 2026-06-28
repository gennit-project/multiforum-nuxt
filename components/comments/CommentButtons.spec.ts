import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import CommentButtons from '@/components/comments/CommentButtons.vue';
import VoteButtons from '@/components/comments/VoteButtons.vue';

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    path: '/forums/cats/discussions/1',
    params: {},
  }),
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ({ value: 'alice' }),
  useModProfileName: () => ({ value: '' }),
}));

// Shared stubs: most children are rendered as inert divs; EmojiButtons and
// NewEmojiButton forward the two interaction events the parent listens for, and
// VoteButtons exposes show-downvote so we can assert the author check.
const baseStubs = {
  ReplyButton: { template: '<div />' },
  SaveButton: { template: '<div />' },
  TextEditor: { template: '<div />' },
  CancelButton: { template: '<div />' },
  AddToCommentFavorites: { template: '<div />' },
  ErrorBanner: { template: '<div />' },
  VoteButtons: {
    props: ['showDownvote'],
    template: '<div data-testid="vote-buttons" />',
  },
  EmojiButtons: {
    template:
      '<button data-testid="emoji-chip" @click="$emit(\'toggle-emoji-picker\')" />',
    emits: ['toggle-emoji-picker', 'blocked-action'],
  },
  NewEmojiButton: {
    template:
      '<button data-testid="new-emoji" @click="$emit(\'toggle-emoji-picker\')" />',
    emits: ['toggle-emoji-picker', 'blocked-action'],
  },
  SuspensionNotice: {
    template: '<div data-testid="suspension-notice" />',
    props: [
      'issueNumber',
      'channelId',
      'suspendedUntil',
      'suspendedIndefinitely',
      'message',
    ],
  },
};

const sharedBaseProps = {
  commentData: {
    id: 'comment-1',
    emoji: '{"thumbsup":{"👍":["bob"]}}',
    CommentAuthor: { __typename: 'User', username: 'bob' },
    DiscussionChannel: { discussionId: 'discussion-1', channelUniqueName: 'cats' },
    Channel: { uniqueName: 'cats' },
    isFavoritedByUser: false,
  },
  depth: 1,
};

const mountButtons = (props: Record<string, unknown> = {}) =>
  mount(CommentButtons, {
    props: { ...sharedBaseProps, ...props },
    global: { stubs: baseStubs },
  });

// Find a clickable <span> action by its visible text.
const span = (wrapper: ReturnType<typeof mountButtons>, text: string) =>
  wrapper.findAll('span').find((s) => s.text().includes(text));

describe('CommentButtons', () => {
  const baseProps = {
    commentData: {
      id: 'comment-1',
      emoji: '{"thumbsup":{"👍":["bob"]}}',
      CommentAuthor: {
        __typename: 'User',
        username: 'bob',
      },
      DiscussionChannel: {
        discussionId: 'discussion-1',
        channelUniqueName: 'cats',
      },
      Channel: {
        uniqueName: 'cats',
      },
      isFavoritedByUser: false,
    },
    depth: 1,
  };

  it('shows suspension notice when emoji interaction is blocked', async () => {
    const wrapper = mount(CommentButtons, {
      props: {
        ...baseProps,
        suspensionIssueNumber: 77,
        suspensionChannelId: 'cats',
        suspensionUntil: '2030-01-01T00:00:00.000Z',
      },
      global: {
        stubs: {
          VoteButtons: { template: '<div />' },
          ReplyButton: { template: '<div />' },
          SaveButton: { template: '<div />' },
          TextEditor: { template: '<div />' },
          CancelButton: { template: '<div />' },
          AddToCommentFavorites: { template: '<div />' },
          ErrorBanner: { template: '<div />' },
          EmojiButtons: {
            template:
              '<button data-testid="emoji-chip" @click="$emit(\'blocked-action\')"></button>',
            emits: ['blocked-action'],
          },
          NewEmojiButton: {
            template:
              '<button data-testid="new-emoji" @click="$emit(\'blocked-action\')"></button>',
            emits: ['blocked-action'],
          },
          SuspensionNotice: {
            template: '<div data-testid="suspension-notice"></div>',
            props: [
              'issueNumber',
              'channelId',
              'suspendedUntil',
              'suspendedIndefinitely',
              'message',
            ],
          },
        },
      },
    });

    await wrapper.find('[data-testid="new-emoji"]').trigger('click');

    expect(wrapper.find('[data-testid="suspension-notice"]').exists()).toBe(true);
  });

  it('hides emoji controls when emoji reactions are disabled', () => {
    const wrapper = mount(CommentButtons, {
      props: {
        ...baseProps,
        enableEmoji: false,
      },
      global: {
        stubs: {
          VoteButtons: { template: '<div />' },
          ReplyButton: { template: '<div />' },
          SaveButton: { template: '<div />' },
          TextEditor: { template: '<div />' },
          CancelButton: { template: '<div />' },
          AddToCommentFavorites: { template: '<div />' },
          ErrorBanner: { template: '<div />' },
          EmojiButtons: {
            template: '<button data-testid="emoji-chip"></button>',
          },
          NewEmojiButton: {
            template: '<button data-testid="new-emoji"></button>',
          },
          SuspensionNotice: { template: '<div />' },
        },
      },
    });

    expect(wrapper.find('[data-testid="new-emoji"]').exists()).toBe(false);
  });

  describe('emoji picker toggling', () => {
    beforeEach(() => routerPush.mockClear());

    it('hides the reply editor when the picker opens', async () => {
      const wrapper = mountButtons();
      await wrapper.find('[data-testid="new-emoji"]').trigger('click');
      expect(wrapper.emitted('hideReplyEditor')).toBeTruthy();
    });

    it('shows the suspension notice instead of opening when suspended', async () => {
      const wrapper = mountButtons({
        suspensionIssueNumber: 77,
        suspensionChannelId: 'cats',
      });
      await wrapper.find('[data-testid="new-emoji"]').trigger('click');
      expect(wrapper.find('[data-testid="suspension-notice"]').exists()).toBe(
        true
      );
      expect(wrapper.emitted('hideReplyEditor')).toBeTruthy();
    });
  });

  describe('author detection (show-downvote)', () => {
    const downvote = (wrapper: ReturnType<typeof mountButtons>) =>
      wrapper.findComponent(VoteButtons).props('showDownvote');

    it('allows downvoting when the viewer is not the author', () => {
      expect(downvote(mountButtons())).toBe(true);
    });

    it('hides downvoting when the viewer authored the comment', () => {
      const wrapper = mountButtons({
        commentData: {
          ...sharedBaseProps.commentData,
          CommentAuthor: { __typename: 'User', username: 'alice' },
        },
      });
      expect(downvote(wrapper)).toBe(false);
    });

    it('treats a non-matching ModerationProfile author as not the viewer', () => {
      const wrapper = mountButtons({
        commentData: {
          ...sharedBaseProps.commentData,
          CommentAuthor: { __typename: 'ModerationProfile', displayName: 'mod1' },
        },
      });
      expect(downvote(wrapper)).toBe(true);
    });
  });

  describe('edit controls', () => {
    it('emits hideEditCommentEditor when Cancel is clicked', async () => {
      const wrapper = mountButtons({ showEditCommentField: true });
      await span(wrapper, 'Cancel')!.trigger('click');
      expect(wrapper.emitted('hideEditCommentEditor')).toBeTruthy();
    });

    it('emits saveEdit and startCommentSave when Save is clicked', async () => {
      const wrapper = mountButtons({ showEditCommentField: true });
      await span(wrapper, 'Save')!.trigger('click');
      expect(wrapper.emitted('saveEdit')).toBeTruthy();
      expect(wrapper.emitted('startCommentSave')).toBeTruthy();
    });

    it('does not save when saving is disabled', async () => {
      const wrapper = mountButtons({
        showEditCommentField: true,
        saveDisabled: true,
      });
      await span(wrapper, 'Save')!.trigger('click');
      expect(wrapper.emitted('saveEdit')).toBeUndefined();
    });
  });

  describe('replies and permalink', () => {
    it('emits hideReplies when the hide link is clicked', async () => {
      const wrapper = mountButtons({ showReplies: true, replyCount: 2 });
      await span(wrapper, 'Hide 2 Replies')!.trigger('click');
      expect(wrapper.emitted('hideReplies')).toBeTruthy();
    });

    it('emits showReplies when the show link is clicked', async () => {
      const wrapper = mountButtons({ showReplies: false, replyCount: 1 });
      await span(wrapper, 'Show 1 Reply')!.trigger('click');
      expect(wrapper.emitted('showReplies')).toBeTruthy();
    });

    it('navigates to the comment permalink', async () => {
      routerPush.mockClear();
      const wrapper = mountButtons();
      await span(wrapper, 'Permalink')!.trigger('click');
      expect(routerPush).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'forums-forumId-discussions-discussionId-comments-commentId',
        })
      );
    });
  });
});

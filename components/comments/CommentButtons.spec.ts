import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import CommentButtons from '@/components/comments/CommentButtons.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    path: '/forums/cats/discussions/1',
    params: {},
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/cache', () => ({
  usernameVar: { value: 'alice' },
  modProfileNameVar: { value: '' },
}));

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
});

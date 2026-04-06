import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import EmojiButtons from './EmojiButtons.vue';

const addEmojiToComment = vi.fn();
const removeEmojiFromComment = vi.fn();
const addEmojiToDiscussionChannel = vi.fn();
const removeEmojiFromDiscussionChannel = vi.fn();

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi
    .fn()
    .mockImplementationOnce(() => ({ mutate: addEmojiToComment }))
    .mockImplementationOnce(() => ({ mutate: removeEmojiFromComment }))
    .mockImplementationOnce(() => ({ mutate: addEmojiToDiscussionChannel }))
    .mockImplementationOnce(() => ({ mutate: removeEmojiFromDiscussionChannel })),
}));

vi.mock('@/cache', () => ({
  usernameVar: ref('alice'),
}));

describe('EmojiButtons', () => {
  beforeEach(() => {
    addEmojiToComment.mockReset();
    removeEmojiFromComment.mockReset();
    addEmojiToDiscussionChannel.mockReset();
    removeEmojiFromDiscussionChannel.mockReset();
  });

  it('emits blocked-action and skips mutations when interaction is disabled', async () => {
    const wrapper = mount(EmojiButtons, {
      props: {
        commentId: 'comment-1',
        emojiJson: '{"thumbsup":{"👍":["bob"]}}',
        interactionDisabled: true,
      },
      global: {
        stubs: {
          VoteButton: {
            template:
              '<button data-testid="upvote-emoji-button" @click="$emit(\'vote\')"><slot /></button>',
            props: [
              'class',
              'active',
              'buttonProps',
              'testId',
              'showCount',
              'count',
              'tooltipUnicode',
              'tooltipText',
              'isPermalinked',
            ],
            emits: ['vote'],
          },
        },
      },
    });

    await wrapper.get('[data-testid="upvote-emoji-button"]').trigger('click');

    expect(wrapper.emitted('blocked-action')).toHaveLength(1);
    expect(addEmojiToComment).not.toHaveBeenCalled();
    expect(removeEmojiFromComment).not.toHaveBeenCalled();
  });
});

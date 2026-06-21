import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import EmojiButtons from './EmojiButtons.vue';

const addEmojiToComment = vi.fn();
const removeEmojiFromComment = vi.fn();
const addEmojiToDiscussionChannel = vi.fn();
const removeEmojiFromDiscussionChannel = vi.fn();
let mutationCallIndex = 0;

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => {
    mutationCallIndex += 1;
    const cycleIndex = ((mutationCallIndex - 1) % 4) + 1;
    if (cycleIndex === 1) return { mutate: addEmojiToComment };
    if (cycleIndex === 2) return { mutate: removeEmojiFromComment };
    if (cycleIndex === 3) return { mutate: addEmojiToDiscussionChannel };
    return { mutate: removeEmojiFromDiscussionChannel };
  }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

describe('EmojiButtons', () => {
  beforeEach(() => {
    mutationCallIndex = 0;
    addEmojiToComment.mockReset();
    removeEmojiFromComment.mockReset();
    addEmojiToDiscussionChannel.mockReset();
    removeEmojiFromDiscussionChannel.mockReset();
  });

  const mountWrapper = () =>
    mount(EmojiButtons, {
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

  it('emits blocked-action when interaction is disabled', async () => {
    const wrapper = mountWrapper();

    await wrapper.get('[data-testid="upvote-emoji-button"]').trigger('click');

    expect(wrapper.emitted('blocked-action')).toHaveLength(1);
  });

  it('does not add emoji to a comment when interaction is disabled', async () => {
    const wrapper = mountWrapper();

    await wrapper.get('[data-testid="upvote-emoji-button"]').trigger('click');

    expect(addEmojiToComment).not.toHaveBeenCalled();
  });

  it('does not remove emoji from a comment when interaction is disabled', async () => {
    const wrapper = mountWrapper();

    await wrapper.get('[data-testid="upvote-emoji-button"]').trigger('click');

    expect(removeEmojiFromComment).not.toHaveBeenCalled();
  });
});

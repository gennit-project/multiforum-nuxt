import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import EmojiPicker from '@/components/comments/EmojiPicker.vue';

const h = vi.hoisted(() => ({
  addToComment: vi.fn(),
  addToDiscussion: vi.fn(),
  index: { n: 0 },
  username: null as unknown,
  pickerStub: {
    name: 'VuemojiPicker',
    emits: ['emoji-click'],
    template: '<div class="picker" />',
  },
}));

vi.mock('vuemoji-picker', () => ({ VuemojiPicker: h.pickerStub }));
vi.mock('@vue/apollo-composable', () => ({
  // [0] addEmojiToComment, [1] addEmojiToDiscussionChannel
  useMutation: () => ({ mutate: h.index.n++ === 0 ? h.addToComment : h.addToDiscussion }),
}));
vi.mock('@/composables/useAuthState', () => ({ useUsername: () => h.username }));

const emojiEvent = (overrides: Record<string, unknown> = {}) => ({
  unicode: '😀',
  emoji: { annotation: 'grinning face', char: '😀' },
  ...overrides,
});

const mountPicker = (props: Record<string, unknown> = {}) =>
  mount(EmojiPicker, {
    props,
    global: {
      stubs: { ClientOnly: { template: '<div><slot /></div>' } },
      directives: { clickOutside: {}, 'click-outside': {} },
    },
  });

const picker = (w: ReturnType<typeof mount>) => w.getComponent(h.pickerStub);

beforeEach(() => {
  vi.clearAllMocks();
  h.index.n = 0;
  h.addToComment = vi.fn();
  h.addToDiscussion = vi.fn();
  h.username = ref('alice');
});

describe('EmojiPicker comment', () => {
  it('adds an emoji to a comment', async () => {
    const wrapper = mountPicker({ commentId: 'c1' });

    await picker(wrapper).vm.$emit('emoji-click', emojiEvent());

    expect(h.addToComment).toHaveBeenCalledWith({
      commentId: 'c1',
      emojiLabel: 'grinning face',
      unicode: '😀',
      username: 'alice',
    });
  });

  it('emits emoji-click with the unicode and char', async () => {
    const wrapper = mountPicker({ commentId: 'c1' });

    await picker(wrapper).vm.$emit('emoji-click', emojiEvent());

    expect(wrapper.emitted('emoji-click')?.[0]).toEqual([
      { unicode: '😀', emoji: '😀' },
    ]);
  });
});

describe('EmojiPicker discussion channel', () => {
  it('adds an emoji to a discussion channel', async () => {
    const wrapper = mountPicker({ discussionChannelId: 'dc1' });

    await picker(wrapper).vm.$emit('emoji-click', emojiEvent());

    expect(h.addToDiscussion).toHaveBeenCalledWith({
      discussionChannelId: 'dc1',
      emojiLabel: 'grinning face',
      unicode: '😀',
      username: 'alice',
    });
  });
});

describe('EmojiPicker guards', () => {
  it('ignores an event with no unicode', async () => {
    const wrapper = mountPicker({ commentId: 'c1' });

    await picker(wrapper).vm.$emit('emoji-click', { emoji: { annotation: 'x' } });

    expect(h.addToComment).not.toHaveBeenCalled();
  });

  it('does nothing when there is no username', async () => {
    h.username = ref('');
    const wrapper = mountPicker({ commentId: 'c1' });

    await picker(wrapper).vm.$emit('emoji-click', emojiEvent());

    expect(h.addToComment).not.toHaveBeenCalled();
  });

  it('does not mutate without a comment or discussion id', async () => {
    const wrapper = mountPicker();

    await picker(wrapper).vm.$emit('emoji-click', emojiEvent());

    expect(h.addToComment).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import EmojiPicker from '@/components/comments/EmojiPicker.vue';

const h = vi.hoisted(() => ({
  addToComment: vi.fn(),
  addToDiscussion: vi.fn(),
  mutationIndex: 0,
  username: 'alice',
  load: vi.fn().mockResolvedValue(undefined),
  search: vi.fn().mockResolvedValue(undefined),
  setSkinTone: vi.fn().mockResolvedValue(undefined),
  selectEmoji: vi.fn((emoji: { annotation: string; unicode: string }) => ({
    annotation: emoji.annotation,
    baseUnicode: emoji.unicode,
    unicode: emoji.unicode,
  })),
  selectRecent: vi.fn((emoji: { annotation: string; unicode: string }) => ({
    ...emoji,
    baseUnicode: emoji.unicode,
  })),
  categories: [
    {
      id: 0,
      icon: '😀',
      label: 'Smileys and emotion',
      emojis: [
        {
          annotation: 'grinning face',
          group: 0,
          name: 'grinning face',
          order: 1,
          unicode: '😀',
          version: 1,
        },
        {
          annotation: 'beaming face',
          group: 0,
          name: 'beaming face',
          order: 2,
          unicode: '😁',
          version: 1,
        },
      ],
    },
  ],
  recents: [{ annotation: 'red heart', unicode: '❤️' }],
  searchResults: [] as Array<Record<string, unknown>>,
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: h.mutationIndex++ === 0 ? h.addToComment : h.addToDiscussion,
  }),
}));
vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return { useUsername: () => ref(h.username) };
});
vi.mock('@/composables/useEmojiCatalog', async () => {
  const { ref } = await import('vue');
  return {
    useEmojiCatalog: () => ({
      categories: ref(h.categories),
      error: ref(''),
      load: h.load,
      loading: ref(false),
      recents: ref(h.recents),
      search: h.search,
      searching: ref(false),
      searchResults: ref(h.searchResults),
      selectEmoji: h.selectEmoji,
      selectRecent: h.selectRecent,
      setSkinTone: h.setSkinTone,
      skinTone: ref(0),
      unicodeFor: (emoji: { unicode: string }) => emoji.unicode,
    }),
  };
});

const mountedWrappers: Array<ReturnType<typeof mount>> = [];
const mountPicker = async (props: Record<string, unknown> = {}) => {
  const wrapper = mount(EmojiPicker, { props, attachTo: document.body });
  mountedWrappers.push(wrapper);
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  vi.clearAllMocks();
  h.mutationIndex = 0;
  h.username = 'alice';
  h.searchResults = [];
});

afterEach(() => {
  mountedWrappers.splice(0).forEach((wrapper) => wrapper.unmount());
});

describe('EmojiPicker', () => {
  it('puts recent emoji before the standard categories', async () => {
    const wrapper = await mountPicker();

    expect(wrapper.findAll('h2').map((heading) => heading.text())).toEqual([
      'Recently used',
      'Smileys and emotion',
    ]);
  });

  it('adds a selected emoji to a comment', async () => {
    const wrapper = await mountPicker({ commentId: 'c1' });

    await wrapper.get('button[aria-label="grinning face"]').trigger('click');

    expect(h.addToComment).toHaveBeenCalledWith({
      commentId: 'c1',
      emojiLabel: 'grinning face',
      unicode: '😀',
      username: 'alice',
    });
  });

  it('adds a selected emoji to a discussion', async () => {
    const wrapper = await mountPicker({ discussionChannelId: 'd1' });

    await wrapper.get('button[aria-label="grinning face"]').trigger('click');

    expect(h.addToDiscussion).toHaveBeenCalledWith({
      discussionChannelId: 'd1',
      emojiLabel: 'grinning face',
      unicode: '😀',
      username: 'alice',
    });
  });

  it('emits the existing emoji-click event shape', async () => {
    const wrapper = await mountPicker({ commentId: 'c1' });

    await wrapper.get('button[aria-label="grinning face"]').trigger('click');

    expect(wrapper.emitted('emoji-click')?.[0]).toEqual([
      { emoji: '😀', unicode: '😀' },
    ]);
  });

  it('searches after the user types', async () => {
    vi.useFakeTimers();
    const wrapper = await mountPicker();

    await wrapper.get('input[type="search"]').setValue('party');
    await vi.advanceTimersByTimeAsync(150);
    vi.useRealTimers();

    expect(h.search).toHaveBeenCalledWith('party');
  });

  it('moves focus into the emoji grid with ArrowDown', async () => {
    const wrapper = await mountPicker();

    await wrapper.get('input[type="search"]').trigger('keydown', {
      key: 'ArrowDown',
    });
    await flushPromises();

    expect(document.activeElement?.getAttribute('aria-label')).toBe(
      'red heart'
    );
  });

  it('supports arrow-key movement inside a grid', async () => {
    const wrapper = await mountPicker();
    const firstCategoryEmoji = wrapper.get(
      'section[id="emoji-category-0"] button[aria-label="grinning face"]'
    );

    firstCategoryEmoji.element.focus();
    await firstCategoryEmoji.trigger('keydown', { key: 'ArrowRight' });

    expect(document.activeElement?.getAttribute('aria-label')).toBe(
      'beaming face'
    );
  });

  it('closes on Escape when search is empty', async () => {
    const wrapper = await mountPicker();

    await wrapper.get('input[type="search"]').trigger('keydown', {
      key: 'Escape',
    });

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('stores a changed skin tone preference', async () => {
    const wrapper = await mountPicker();

    await wrapper.get('select[aria-label="Skin tone"]').setValue('3');

    expect(h.setSkinTone).toHaveBeenCalledWith(3);
  });
});

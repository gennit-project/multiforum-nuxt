import { ref } from 'vue';
import type EmojiDatabase from 'emoji-picker-element/database';
import type { NativeEmoji, SkinTone } from 'emoji-picker-element/shared';
import {
  addRecentEmoji,
  getRecentEmojiStorageKey,
  parseRecentEmojis,
  type RecentEmoji,
} from '@/utils/emojiRecents';

export type EmojiCategory = {
  id: number;
  icon: string;
  label: string;
  emojis: NativeEmoji[];
};

export type EmojiSelection = RecentEmoji & {
  baseUnicode: string;
};

const CATEGORY_DEFINITIONS = [
  { id: 0, icon: '😀', label: 'Smileys and emotion' },
  { id: 1, icon: '👋', label: 'People and body' },
  { id: 3, icon: '🐱', label: 'Animals and nature' },
  { id: 4, icon: '🍎', label: 'Food and drink' },
  { id: 5, icon: '🏠', label: 'Travel and places' },
  { id: 6, icon: '⚽', label: 'Activities' },
  { id: 7, icon: '📝', label: 'Objects' },
  { id: 8, icon: '⛔', label: 'Symbols' },
  { id: 9, icon: '🏁', label: 'Flags' },
] as const;

export function useEmojiCatalog(username: () => string) {
  const categories = ref<EmojiCategory[]>([]);
  const searchResults = ref<NativeEmoji[]>([]);
  const recents = ref<RecentEmoji[]>([]);
  const skinTone = ref<SkinTone>(0);
  const loading = ref(false);
  const searching = ref(false);
  const error = ref('');
  let database: EmojiDatabase | null = null;
  let latestSearch = 0;

  function loadRecents() {
    if (typeof window === 'undefined') return;
    recents.value = parseRecentEmojis(
      localStorage.getItem(getRecentEmojiStorageKey(username()))
    );
  }

  function persistRecent(selected: RecentEmoji) {
    recents.value = addRecentEmoji(recents.value, selected);
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      getRecentEmojiStorageKey(username()),
      JSON.stringify(recents.value)
    );
  }

  async function load() {
    if (
      typeof window === 'undefined' ||
      loading.value ||
      categories.value.length
    )
      return;

    loading.value = true;
    error.value = '';
    loadRecents();

    try {
      const { default: Database } =
        await import('emoji-picker-element/database');
      database = new Database();
      await database.ready();

      const [loadedCategories, preferredSkinTone] = await Promise.all([
        Promise.all(
          CATEGORY_DEFINITIONS.map(async (category) => ({
            ...category,
            emojis: await database!.getEmojiByGroup(category.id),
          }))
        ),
        database.getPreferredSkinTone(),
      ]);

      categories.value = loadedCategories;
      skinTone.value = preferredSkinTone;
    } catch {
      error.value = 'Emoji could not be loaded. Please try again.';
    } finally {
      loading.value = false;
    }
  }

  async function search(query: string) {
    const trimmedQuery = query.trim();
    const searchId = ++latestSearch;

    if (!trimmedQuery || !database) {
      searchResults.value = [];
      searching.value = false;
      return;
    }

    searching.value = true;
    try {
      const results = await database.getEmojiBySearchQuery(trimmedQuery);
      if (searchId !== latestSearch) return;
      searchResults.value = results.filter(
        (emoji): emoji is NativeEmoji => 'unicode' in emoji
      );
    } catch {
      if (searchId === latestSearch) searchResults.value = [];
    } finally {
      if (searchId === latestSearch) searching.value = false;
    }
  }

  function unicodeFor(emoji: NativeEmoji): string {
    if (!skinTone.value) return emoji.unicode;
    return (
      emoji.skins?.find((skin) => skin.tone === skinTone.value)?.unicode ||
      emoji.unicode
    );
  }

  async function setSkinTone(tone: SkinTone) {
    skinTone.value = tone;
    await database?.setPreferredSkinTone(tone);
  }

  function selectEmoji(emoji: NativeEmoji): EmojiSelection {
    const selected = {
      annotation: emoji.annotation,
      unicode: unicodeFor(emoji),
    };
    persistRecent(selected);
    void database?.incrementFavoriteEmojiCount(emoji.unicode);
    return { ...selected, baseUnicode: emoji.unicode };
  }

  function selectRecent(emoji: RecentEmoji): EmojiSelection {
    persistRecent(emoji);
    return { ...emoji, baseUnicode: emoji.unicode };
  }

  return {
    categories,
    error,
    load,
    loading,
    recents,
    search,
    searching,
    searchResults,
    selectEmoji,
    selectRecent,
    setSkinTone,
    skinTone,
    unicodeFor,
  };
}

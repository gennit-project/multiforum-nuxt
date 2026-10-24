export type RecentEmoji = {
  annotation: string;
  unicode: string;
};

const STORAGE_PREFIX = 'multiforum:recent-emojis';
export const MAX_RECENT_EMOJIS = 24;

export function getRecentEmojiStorageKey(username: string): string {
  return `${STORAGE_PREFIX}:${encodeURIComponent(username || 'anonymous')}`;
}

export function parseRecentEmojis(value: string | null): RecentEmoji[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is RecentEmoji =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as RecentEmoji).unicode === 'string' &&
        typeof (item as RecentEmoji).annotation === 'string'
    );
  } catch {
    return [];
  }
}

export function addRecentEmoji(
  recents: RecentEmoji[],
  selected: RecentEmoji
): RecentEmoji[] {
  return [
    selected,
    ...recents.filter((emoji) => emoji.unicode !== selected.unicode),
  ].slice(0, MAX_RECENT_EMOJIS);
}

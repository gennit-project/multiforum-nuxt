import { describe, expect, it } from 'vitest';
import {
  MAX_RECENT_EMOJIS,
  addRecentEmoji,
  getRecentEmojiStorageKey,
  parseRecentEmojis,
} from '@/utils/emojiRecents';

describe('emojiRecents', () => {
  it('keys recent emoji by username', () => {
    expect(getRecentEmojiStorageKey('alice@example.com')).toBe(
      'multiforum:recent-emojis:alice%40example.com'
    );
  });

  it('places the latest selection first and removes its old position', () => {
    const result = addRecentEmoji(
      [
        { annotation: 'heart', unicode: '❤️' },
        { annotation: 'grin', unicode: '😀' },
      ],
      { annotation: 'grin', unicode: '😀' }
    );

    expect(result).toEqual([
      { annotation: 'grin', unicode: '😀' },
      { annotation: 'heart', unicode: '❤️' },
    ]);
  });

  it('limits recent emoji history', () => {
    const existing = Array.from({ length: MAX_RECENT_EMOJIS }, (_, index) => ({
      annotation: `emoji ${index}`,
      unicode: String(index),
    }));

    expect(
      addRecentEmoji(existing, { annotation: 'new', unicode: 'new' })
    ).toHaveLength(MAX_RECENT_EMOJIS);
  });

  it('returns an empty list for invalid stored JSON', () => {
    expect(parseRecentEmojis('{broken')).toEqual([]);
  });

  it('filters malformed stored entries', () => {
    expect(
      parseRecentEmojis(
        JSON.stringify([
          { annotation: 'grin', unicode: '😀' },
          { annotation: 1, unicode: null },
        ])
      )
    ).toEqual([{ annotation: 'grin', unicode: '😀' }]);
  });
});

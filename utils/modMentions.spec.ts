import { describe, it, expect } from 'vitest';
import {
  hasModMention,
  buildModMentionOptions,
  getModMentionState,
  filterModSuggestions,
  type ModSummary,
} from './modMentions';

describe('modMentions', () => {
  describe('hasModMention', () => {
    it('returns true when text contains /m/ mention', () => {
      expect(hasModMention('Hey /m/alice can you help?')).toBe(true);
    });

    it('returns true for mod names with underscores', () => {
      expect(hasModMention('Thanks /m/mod_helper!')).toBe(true);
    });

    it('returns true for mod names with hyphens', () => {
      expect(hasModMention('Thanks /m/mod-helper!')).toBe(true);
    });

    it('returns false when text has no mod mentions', () => {
      expect(hasModMention('Hello everyone!')).toBe(false);
    });

    it('returns false for null or undefined input', () => {
      expect(hasModMention(null)).toBe(false);
      expect(hasModMention(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(hasModMention('')).toBe(false);
    });

    it('does not match /m without trailing slash', () => {
      expect(hasModMention('Check /m for mods')).toBe(false);
    });
  });

  describe('buildModMentionOptions', () => {
    it('builds suggestions from mod profiles', () => {
      const mods: ModSummary[] = [
        { displayName: 'alice', username: 'alice_user' },
        { displayName: 'bob', username: 'bob_user' },
      ];

      const result = buildModMentionOptions({ mods });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        value: 'alice',
        label: 'alice (@alice_user)',
        mention: '/m/alice',
        displayName: 'alice',
        username: 'alice_user',
      });
    });

    it('handles mods without username', () => {
      const mods: ModSummary[] = [{ displayName: 'anonymous_mod' }];

      const result = buildModMentionOptions({ mods });

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('anonymous_mod');
      expect(result[0].username).toBeUndefined();
    });

    it('skips mods with empty displayName', () => {
      const mods: ModSummary[] = [
        { displayName: '', username: 'user1' },
        { displayName: 'valid_mod', username: 'user2' },
      ];

      const result = buildModMentionOptions({ mods });

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('valid_mod');
    });

    it('returns empty array for empty input', () => {
      const result = buildModMentionOptions({ mods: [] });
      expect(result).toHaveLength(0);
    });
  });

  describe('getModMentionState', () => {
    it('returns state when cursor is after /m/ trigger', () => {
      const text = 'Hey /m/ali';
      const cursorIndex = 10; // After 'ali'

      const result = getModMentionState(text, cursorIndex);

      expect(result).not.toBeNull();
      expect(result!.triggerIndex).toBe(4); // Index of '/m/'
      expect(result!.query).toBe('ali');
    });

    it('returns null for empty text', () => {
      expect(getModMentionState('', 0)).toBeNull();
    });

    it('returns null for negative cursor index', () => {
      expect(getModMentionState('text', -1)).toBeNull();
    });

    it('returns null when no /m/ trigger exists', () => {
      const result = getModMentionState('Hello world', 5);
      expect(result).toBeNull();
    });

    it('returns null when space exists after trigger', () => {
      // User typed /m/alice then space, so autocomplete should close
      const text = 'Hey /m/alice thanks';
      const cursorIndex = 19;

      const result = getModMentionState(text, cursorIndex);
      expect(result).toBeNull();
    });

    it('returns null for invalid characters in query', () => {
      // @ is not valid in mod names
      const text = 'Hey /m/@invalid';
      const cursorIndex = 15;

      const result = getModMentionState(text, cursorIndex);
      expect(result).toBeNull();
    });

    it('handles empty query after trigger', () => {
      const text = 'Hey /m/';
      const cursorIndex = 7;

      const result = getModMentionState(text, cursorIndex);

      expect(result).not.toBeNull();
      expect(result!.query).toBe('');
    });

    it('handles multiple /m/ triggers and uses the last one', () => {
      const text = 'Hey /m/alice and /m/bob';
      const cursorIndex = 23;

      const result = getModMentionState(text, cursorIndex);

      expect(result).not.toBeNull();
      expect(result!.query).toBe('bob');
    });
  });

  describe('filterModSuggestions', () => {
    const suggestions = [
      {
        value: 'alice',
        label: 'alice',
        mention: '/m/alice',
        displayName: 'alice',
      },
      { value: 'bob', label: 'bob', mention: '/m/bob', displayName: 'bob' },
      {
        value: 'alex',
        label: 'alex',
        mention: '/m/alex',
        displayName: 'alex',
      },
    ];

    it('returns all suggestions (up to 8) when query is empty', () => {
      const result = filterModSuggestions(suggestions, '');
      expect(result).toHaveLength(3);
    });

    it('filters suggestions by prefix', () => {
      const result = filterModSuggestions(suggestions, 'al');

      expect(result).toHaveLength(2);
      expect(result.map((s) => s.value)).toEqual(['alice', 'alex']);
    });

    it('is case insensitive', () => {
      const result = filterModSuggestions(suggestions, 'AL');

      expect(result).toHaveLength(2);
      expect(result.map((s) => s.value)).toEqual(['alice', 'alex']);
    });

    it('returns empty array when no matches', () => {
      const result = filterModSuggestions(suggestions, 'xyz');
      expect(result).toHaveLength(0);
    });

    it('limits results to 8 items', () => {
      const manySuggestions = Array.from({ length: 20 }, (_, i) => ({
        value: `mod${i}`,
        label: `mod${i}`,
        mention: `/m/mod${i}`,
        displayName: `mod${i}`,
      }));

      const result = filterModSuggestions(manySuggestions, 'mod');
      expect(result).toHaveLength(8);
    });
  });
});

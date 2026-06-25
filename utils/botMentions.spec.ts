import { describe, it, expect } from 'vitest';
import {
  hasBotMention,
  buildBotMentionOptions,
  getBotMentionState,
  filterBotSuggestions,
  type BotSuggestion,
} from './botMentions';

describe('hasBotMention', () => {
  it('returns false for empty text', () => {
    expect(hasBotMention('')).toBe(false);
  });

  it('detects a /bot/name mention', () => {
    expect(hasBotMention('hey /bot/summarizer please')).toBe(true);
  });

  it('detects a profile-qualified mention', () => {
    expect(hasBotMention('/bot/summarizer:abc123')).toBe(true);
  });

  it('returns false for plain text without a mention', () => {
    expect(hasBotMention('no bots here')).toBe(false);
  });
});

describe('buildBotMentionOptions', () => {
  it('strips the bot-{channel}- prefix from the suggestion value', () => {
    const opts = buildBotMentionOptions({
      channelUniqueName: 'cats',
      bots: [{ username: 'bot-cats-summarizer' }],
    });
    expect(opts[0].value).toBe('summarizer');
  });

  it('appends the bot profile id to the value when present', () => {
    const opts = buildBotMentionOptions({
      channelUniqueName: 'cats',
      bots: [{ username: 'bot-cats-summarizer', botProfileId: 'p1' }],
    });
    expect(opts[0].value).toBe('summarizer:p1');
  });

  it('skips bots with no username', () => {
    expect(
      buildBotMentionOptions({ channelUniqueName: 'cats', bots: [{ username: '' }] })
    ).toEqual([]);
  });

  it('uses the display name in the label when provided', () => {
    const opts = buildBotMentionOptions({
      channelUniqueName: 'cats',
      bots: [{ username: 'bot-cats-sum', displayName: 'Summarizer' }],
    });
    expect(opts[0].label).toBe('Summarizer (/bot/sum)');
  });
});

describe('getBotMentionState', () => {
  it('returns the query after a /bot/ trigger', () => {
    expect(getBotMentionState('hello /bot/sum', 14)).toEqual({
      triggerIndex: 6,
      query: 'sum',
    });
  });

  it('returns null when there is no trigger before the cursor', () => {
    expect(getBotMentionState('plain text', 5)).toBeNull();
  });

  it('returns null when whitespace follows the trigger', () => {
    expect(getBotMentionState('/bot/sum and more', 17)).toBeNull();
  });

  it('rejects a bare trigger that is not at a word boundary', () => {
    expect(getBotMentionState('xbot/sum', 8)).toBeNull();
  });
});

describe('filterBotSuggestions', () => {
  const suggestions: BotSuggestion[] = [
    { value: 'summarizer', label: '', mention: '' },
    { value: 'sentiment', label: '', mention: '' },
    { value: 'translate', label: '', mention: '' },
  ];

  it('returns the first eight suggestions for an empty query', () => {
    expect(filterBotSuggestions(suggestions, '')).toHaveLength(3);
  });

  it('filters by case-insensitive prefix', () => {
    expect(
      filterBotSuggestions(suggestions, 'S').map((s) => s.value)
    ).toEqual(['summarizer', 'sentiment']);
  });
});

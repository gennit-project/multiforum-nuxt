import { describe, it, expect } from 'vitest';
import {
  getBotMentionState,
  hasBotMention,
  buildBotMentionOptions,
  filterBotSuggestions,
  type BotSuggestion,
  type BotSummary,
} from '@/utils/botMentions';

describe('getBotMentionState', () => {
  it('recognizes the /bots/ trigger', () => {
    const text = 'Write to the team /bots/';
    const triggerIndex = text.indexOf('/bots/');
    const state = getBotMentionState(text, text.length);

    expect(state).toEqual({
      triggerIndex,
      query: '',
    });
  });

  it('falls back to the /bot/ trigger when bots/ is not used', () => {
    const text = 'Ask about /bot/';
    const triggerIndex = text.indexOf('/bot/');
    const state = getBotMentionState(text, text.length);

    expect(state).toEqual({
      triggerIndex,
      query: '',
    });
  });

  it('captures the query following /bots/', () => {
    const text = 'Refer to /bots/advice';
    const triggerIndex = text.indexOf('/bots/');
    const state = getBotMentionState(text, text.length);

    expect(state).toEqual({
      triggerIndex,
      query: 'advice',
    });
  });

  it('handles a bare bots/ trigger after whitespace', () => {
    const text = ' bots/';
    const triggerIndex = text.indexOf('bots/');
    const state = getBotMentionState(text, text.length);

    expect(state).toEqual({
      triggerIndex,
      query: '',
    });
  });

  it('returns null for empty text', () => {
    expect(getBotMentionState('', 0)).toBeNull();
  });

  it('returns null for negative cursor index', () => {
    expect(getBotMentionState('some text', -1)).toBeNull();
  });

  it('returns null when query contains whitespace', () => {
    const text = '/bot/helper name';
    const state = getBotMentionState(text, text.length);

    expect(state).toBeNull();
  });

  it('returns null for invalid characters in query', () => {
    const text = '/bot/helper@name';
    const state = getBotMentionState(text, text.length);

    expect(state).toBeNull();
  });

  it('rejects bare bots/ without valid boundary', () => {
    const text = 'wordbots/';
    const state = getBotMentionState(text, text.length);

    expect(state).toBeNull();
  });

  it('accepts bare bot/ at start of text', () => {
    const text = 'bot/helper';
    const state = getBotMentionState(text, text.length);

    expect(state).toEqual({
      triggerIndex: 0,
      query: 'helper',
    });
  });

  it('accepts bare bot/ after newline', () => {
    const text = 'line1\nbot/helper';
    const state = getBotMentionState(text, text.length);

    expect(state).toEqual({
      triggerIndex: 6,
      query: 'helper',
    });
  });

  it('accepts bare bot/ after tab', () => {
    const text = '\tbot/helper';
    const state = getBotMentionState(text, text.length);

    expect(state).toEqual({
      triggerIndex: 1,
      query: 'helper',
    });
  });

  it('handles colon in query for bot profile IDs', () => {
    const text = '/bot/helper:123';
    const state = getBotMentionState(text, text.length);

    expect(state).toEqual({
      triggerIndex: 0,
      query: 'helper:123',
    });
  });
});

describe('hasBotMention', () => {
  it('returns true for valid bot mention', () => {
    expect(hasBotMention('Check out /bot/helper for help')).toBe(true);
  });

  it('returns true for bot mention with profile ID', () => {
    expect(hasBotMention('Ask /bot/helper:abc123 about this')).toBe(true);
  });

  it('returns false for null input', () => {
    expect(hasBotMention(null)).toBe(false);
  });

  it('returns false for undefined input', () => {
    expect(hasBotMention(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(hasBotMention('')).toBe(false);
  });

  it('returns false for text without bot mention', () => {
    expect(hasBotMention('This is just regular text')).toBe(false);
  });

  it('returns false for incomplete bot path', () => {
    expect(hasBotMention('Go to /bot/ for help')).toBe(false);
  });
});

describe('buildBotMentionOptions', () => {
  it('builds suggestions from bot summaries', () => {
    const bots: BotSummary[] = [
      { username: 'helper', displayName: 'Helper Bot' },
      { username: 'assistant' },
    ];

    const result = buildBotMentionOptions({ bots });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      value: 'helper',
      label: 'Helper Bot (/bot/helper)',
      mention: '/bot/helper',
      displayName: 'Helper Bot',
      isDeprecated: false,
    });
    expect(result[1]).toEqual({
      value: 'assistant',
      label: '/bot/assistant',
      mention: '/bot/assistant',
      displayName: undefined,
      isDeprecated: false,
    });
  });

  it('strips channel prefix from username', () => {
    const bots: BotSummary[] = [
      { username: 'bot-mychannel-helper' },
    ];

    const result = buildBotMentionOptions({
      channelUniqueName: 'mychannel',
      bots,
    });

    expect(result[0]!.value).toBe('helper');
    expect(result[0]!.mention).toBe('/bot/helper');
  });

  it('appends botProfileId to value when present', () => {
    const bots: BotSummary[] = [
      { username: 'helper', botProfileId: 'abc123' },
    ];

    const result = buildBotMentionOptions({ bots });

    expect(result[0]!.value).toBe('helper:abc123');
    expect(result[0]!.mention).toBe('/bot/helper:abc123');
  });

  it('strips botProfileId suffix from username before building', () => {
    const bots: BotSummary[] = [
      { username: 'helper-abc123', botProfileId: 'abc123' },
    ];

    const result = buildBotMentionOptions({ bots });

    expect(result[0]!.value).toBe('helper:abc123');
  });

  it('skips bots with empty username', () => {
    const bots: BotSummary[] = [
      { username: '' },
      { username: 'valid' },
    ];

    const result = buildBotMentionOptions({ bots });

    expect(result).toHaveLength(1);
    expect(result[0]!.value).toBe('valid');
  });

  it('marks deprecated bots', () => {
    const bots: BotSummary[] = [
      { username: 'oldbot', isDeprecated: true },
    ];

    const result = buildBotMentionOptions({ bots });

    expect(result[0]!.isDeprecated).toBe(true);
  });

  it('handles empty bots array', () => {
    const result = buildBotMentionOptions({ bots: [] });

    expect(result).toEqual([]);
  });

  it('handles null channelUniqueName', () => {
    const bots: BotSummary[] = [{ username: 'helper' }];

    const result = buildBotMentionOptions({
      channelUniqueName: null,
      bots,
    });

    expect(result[0]!.value).toBe('helper');
  });
});

describe('filterBotSuggestions', () => {
  const suggestions: BotSuggestion[] = [
    { value: 'helper', label: '/bot/helper', mention: '/bot/helper' },
    { value: 'assistant', label: '/bot/assistant', mention: '/bot/assistant' },
    { value: 'helper-pro', label: '/bot/helper-pro', mention: '/bot/helper-pro' },
    { value: 'analyzer', label: '/bot/analyzer', mention: '/bot/analyzer' },
  ];

  it('returns first 8 suggestions when query is empty', () => {
    const result = filterBotSuggestions(suggestions, '');

    expect(result).toHaveLength(4);
    expect(result).toEqual(suggestions);
  });

  it('filters suggestions by prefix match', () => {
    const result = filterBotSuggestions(suggestions, 'help');

    expect(result).toHaveLength(2);
    expect(result[0]!.value).toBe('helper');
    expect(result[1]!.value).toBe('helper-pro');
  });

  it('is case-insensitive', () => {
    const result = filterBotSuggestions(suggestions, 'HELP');

    expect(result).toHaveLength(2);
  });

  it('limits results to 8 items', () => {
    const manySuggestions: BotSuggestion[] = Array.from({ length: 15 }, (_, i) => ({
      value: `bot${i}`,
      label: `/bot/bot${i}`,
      mention: `/bot/bot${i}`,
    }));

    const result = filterBotSuggestions(manySuggestions, '');

    expect(result).toHaveLength(8);
  });

  it('returns empty array when no matches', () => {
    const result = filterBotSuggestions(suggestions, 'xyz');

    expect(result).toEqual([]);
  });
});

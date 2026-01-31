import { describe, it, expect } from 'vitest';
import { getBotMentionState } from '@/utils/botMentions';

describe('botMentions', () => {
  it('recognizes the /bots/ trigger', () => {
    const text = 'Write to the team /bots/';
    const triggerIndex = text.indexOf('/bots/');
    const state = getBotMentionState(text, text.length);

    expect(state).not.toBeNull();
    expect(state).toEqual({
      triggerIndex,
      query: '',
    });
  });

  it('falls back to the /bot/ trigger when bots/ is not used', () => {
    const text = 'Ask about /bot/';
    const triggerIndex = text.indexOf('/bot/');
    const state = getBotMentionState(text, text.length);

    expect(state).not.toBeNull();
    expect(state).toEqual({
      triggerIndex,
      query: '',
    });
  });

  it('captures the query following /bots/', () => {
    const text = 'Refer to /bots/advice';
    const triggerIndex = text.indexOf('/bots/');
    const state = getBotMentionState(text, text.length);

    expect(state).not.toBeNull();
    expect(state).toEqual({
      triggerIndex,
      query: 'advice',
    });
  });

  it('handles a bare bots/ trigger after whitespace', () => {
    const text = ' bots/';
    const triggerIndex = text.indexOf('bots/');
    const state = getBotMentionState(text, text.length);

    expect(state).not.toBeNull();
    expect(state).toEqual({
      triggerIndex,
      query: '',
    });
  });
});

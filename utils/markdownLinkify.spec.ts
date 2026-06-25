import { describe, it, expect } from 'vitest';
import {
  linkifyChannelNames,
  linkifyBotMentions,
  linkifyUrls,
  calculateAspectRatioFit,
  extractImageUrlsFromMarkdown,
  countWords,
} from './markdownLinkify';

describe('linkifyChannelNames', () => {
  it('wraps a bare c/channel mention in a markdown link', () => {
    expect(linkifyChannelNames('see c/cats today')).toContain(
      '[c/cats]('
    );
  });

  it('leaves text without a channel mention unchanged', () => {
    expect(linkifyChannelNames('nothing here')).toBe('nothing here');
  });
});

describe('linkifyBotMentions', () => {
  it('links a /bot/name mention to the per-forum profile', () => {
    expect(
      linkifyBotMentions({ markdownString: 'ask /bot/sum', forumId: 'cats' })
    ).toBe('ask [/bot/sum](/u/bot-cats-sum)');
  });

  it('returns the input unchanged when no forum id is supplied', () => {
    expect(
      linkifyBotMentions({ markdownString: '/bot/sum', forumId: '' })
    ).toBe('/bot/sum');
  });
});

describe('linkifyUrls', () => {
  it('auto-links a bare http URL', () => {
    expect(linkifyUrls('visit https://example.com/x now')).toContain(
      '[https://example.com/x](https://example.com/x)'
    );
  });

  it('does not double-link a URL already inside a markdown link', () => {
    const input = '[site](https://example.com/page)';
    expect(linkifyUrls(input)).toBe(input);
  });
});

describe('calculateAspectRatioFit', () => {
  it('scales down to fit within the bounds preserving ratio', () => {
    expect(
      calculateAspectRatioFit({
        srcWidth: 1000,
        srcHeight: 500,
        maxWidth: 100,
        maxHeight: 100,
      })
    ).toEqual({ width: 100, height: 50 });
  });
});

describe('extractImageUrlsFromMarkdown', () => {
  it('extracts the src of an embedded markdown image', () => {
    expect(
      extractImageUrlsFromMarkdown('![cat](https://img.test/cat.png)')[0].src
    ).toBe('https://img.test/cat.png');
  });

  it('returns an empty array when there are no images', () => {
    expect(extractImageUrlsFromMarkdown('just text')).toEqual([]);
  });
});

describe('countWords', () => {
  it('counts whitespace-delimited words', () => {
    expect(countWords('one two three')).toBe(3);
  });

  it('collapses runs of whitespace', () => {
    expect(countWords('one   two')).toBe(2);
  });
});

import { describe, it, expect, vi } from 'vitest';
import {
  linkifyChannelNames,
  linkifyBotMentions,
  linkifyUrls,
  calculateAspectRatioFit,
  extractImageUrlsFromMarkdown,
  countWords,
} from '@/utils/markdownLinkify';

vi.mock('@/config', () => ({
  config: { baseUrl: 'https://example.com/' },
}));

describe('linkifyChannelNames', () => {
  it('wraps a bare channel mention in a markdown link', () => {
    expect(linkifyChannelNames('see c/cats today')).toBe(
      'see [c/cats](https://example.com/channels/f/cats/discussions) today'
    );
  });

  it('leaves text without a channel mention unchanged', () => {
    expect(linkifyChannelNames('nothing to see')).toBe('nothing to see');
  });

  it('does not linkify a channel segment directly adjacent to a domain', () => {
    // The negative lookbehind guards `c/` immediately after `https://domain`.
    const input = 'visit https://example.comc/cats';
    expect(linkifyChannelNames(input)).toBe(input);
  });
});

describe('linkifyBotMentions', () => {
  it('returns the input unchanged when no forum id is given', () => {
    expect(
      linkifyBotMentions({ markdownString: 'hi /bot/summarizer', forumId: '' })
    ).toBe('hi /bot/summarizer');
  });

  it('links a bot mention to its per-forum profile', () => {
    expect(
      linkifyBotMentions({
        markdownString: 'ping /bot/summarizer',
        forumId: 'cats',
      })
    ).toBe('ping [/bot/summarizer](/u/bot-cats-summarizer)');
  });

  it('preserves the leading boundary character', () => {
    expect(
      linkifyBotMentions({
        markdownString: '(/bot/summarizer)',
        forumId: 'cats',
      })
    ).toBe('([/bot/summarizer](/u/bot-cats-summarizer))');
  });
});

describe('linkifyUrls', () => {
  it('auto-links a bare https URL', () => {
    expect(linkifyUrls('go to https://a.com/page now')).toBe(
      'go to [https://a.com/page](https://a.com/page) now'
    );
  });

  it('prefixes http:// for www URLs in the href', () => {
    expect(linkifyUrls('see www.a.com/page here')).toBe(
      'see [www.a.com/page](http://www.a.com/page) here'
    );
  });

  it('does not double-link a URL already inside a markdown link', () => {
    const input = '[a.com](https://a.com/page)';
    expect(linkifyUrls(input)).toBe(input);
  });
});

describe('calculateAspectRatioFit', () => {
  it('scales down to fit within the bounding box', () => {
    expect(
      calculateAspectRatioFit({
        srcWidth: 1000,
        srcHeight: 500,
        maxWidth: 100,
        maxHeight: 100,
      })
    ).toEqual({ width: 100, height: 50 });
  });

  it('constrains by the limiting (height) dimension', () => {
    expect(
      calculateAspectRatioFit({
        srcWidth: 200,
        srcHeight: 800,
        maxWidth: 100,
        maxHeight: 100,
      })
    ).toEqual({ width: 25, height: 100 });
  });
});

describe('extractImageUrlsFromMarkdown', () => {
  it('extracts the src of an embedded image', () => {
    const items = extractImageUrlsFromMarkdown('![alt](https://a.com/img.png)');
    expect(items.map((i) => i.src)).toEqual(['https://a.com/img.png']);
  });

  it('returns an empty array when there are no images', () => {
    expect(extractImageUrlsFromMarkdown('just text')).toEqual([]);
  });

  it('defaults dimensions to 0 outside the client', () => {
    const items = extractImageUrlsFromMarkdown('![a](https://a.com/i.png)');
    expect([items[0]?.width, items[0]?.height]).toEqual([0, 0]);
  });
});

describe('countWords', () => {
  it('counts whitespace-delimited words', () => {
    expect(countWords('one two three')).toBe(3);
  });

  it('collapses runs of whitespace', () => {
    expect(countWords('  one   two  ')).toBe(2);
  });
});

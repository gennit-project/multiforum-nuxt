import { describe, it, expect } from 'vitest';
import MarkdownIt from 'markdown-it';
import { truncateMarkdown } from './truncateMarkdown';

const md = new MarkdownIt({ html: true });

// What a reader sees: the rendered text with tags stripped.
const renderedText = (markdown: string): string =>
  md
    .render(markdown)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

describe('truncateMarkdown', () => {
  it('returns text under the limit unchanged and not truncated', () => {
    expect(
      truncateMarkdown({ markdown: 'Short *text* here.', wordLimit: 10 })
    ).toEqual({
      text: 'Short *text* here.',
      truncated: false,
    });
  });

  it('flags text over the limit as truncated', () => {
    expect(
      truncateMarkdown({ markdown: 'one two three four', wordLimit: 2 })
        .truncated
    ).toBe(true);
  });

  it.each([
    ['plain words', 'one two three four', 2, 'one two...'],
    [
      'emphasis left open by the cut',
      'one *two three four*',
      2,
      'one *two...*',
    ],
    [
      'strong emphasis left open by the cut',
      'one **two three four**',
      2,
      'one **two...**',
    ],
    [
      'a link left open by the cut',
      'see [the full paper](https://x.org/p) now',
      2,
      'see [the...](https://x.org/p)',
    ],
    [
      'literal asterisks that are not emphasis',
      'a 2 * 3 * 4 b c',
      4,
      'a 2 \\* 3...',
    ],
  ])('closes %s', (_label, markdown, wordLimit, expected) => {
    expect(truncateMarkdown({ markdown, wordLimit }).text).toBe(expected);
  });

  it('keeps earlier blocks verbatim, including their formatting', () => {
    const markdown = 'First **bold** para.\n\nSecond paragraph goes on and on.';
    expect(truncateMarkdown({ markdown, wordLimit: 4 }).text).toBe(
      'First **bold** para.\n\nSecond...'
    );
  });

  it('keeps the heading level when a heading is cut', () => {
    expect(
      truncateMarkdown({ markdown: '## A long heading here', wordLimit: 2 })
        .text
    ).toBe('## A long...');
  });

  it('keeps a spoiler closed when the cut falls inside it', () => {
    expect(
      truncateMarkdown({
        markdown: 'Plot: >!the butler did it!<',
        wordLimit: 3,
      }).text
    ).toBe('Plot: >!the butler...!<');
  });

  it('cuts a list between whole items', () => {
    const markdown = '- first item\n- second item\n- third item';
    expect(truncateMarkdown({ markdown, wordLimit: 4 }).text).toBe(
      '- first item\n- second item\n\n...'
    );
  });

  it('keeps a table header and separator when cutting a table', () => {
    const markdown = '| a | b |\n| - | - |\n| c | d |\n| e | f |';
    expect(truncateMarkdown({ markdown, wordLimit: 4 }).text).toBe(
      '| a | b |\n| - | - |\n| c | d |\n\n...'
    );
  });

  // The case that prompted this: a list-item preview cut through an italic
  // image credit, leaving `*Image: ... [CC BY......` on screen.
  it('never leaves markdown syntax visible in the rendered preview', () => {
    const markdown =
      'Tardigrades survived open space.\n\n' +
      '*Image: Schokraie et al. (2012), [CC BY 2.5](https://creativecommons.org/licenses/by/2.5), via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:X.png)*';
    const { text } = truncateMarkdown({ markdown, wordLimit: 11 });
    expect(renderedText(text)).toBe(
      'Tardigrades survived open space. Image: Schokraie et al. (2012), CC BY...'
    );
  });
});

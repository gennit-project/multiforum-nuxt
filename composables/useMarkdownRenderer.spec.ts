import { describe, it, expect } from 'vitest';
import { useMarkdownRenderer } from './useMarkdownRenderer';

const { renderMarkdown } = useMarkdownRenderer();

describe('renderMarkdown', () => {
  it('renders basic markdown emphasis', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
  });

  it('opens external links in a new tab', () => {
    expect(renderMarkdown('[x](https://example.com)')).toContain(
      'target="_blank"'
    );
  });

  it('does not mark a relative link as external', () => {
    expect(renderMarkdown('[x](/forums/cats)')).not.toContain('target="_blank"');
  });

  it('linkifies a u/ user mention', () => {
    expect(renderMarkdown('hi u/alice')).toContain('href="/u/alice"');
  });

  it('converts spoiler markup to a spoiler span', () => {
    expect(renderMarkdown('>!secret!<')).toContain('class="spoiler-text"');
  });

  it('adds an anchor id to headings', () => {
    expect(renderMarkdown('# My Heading')).toContain('id="my-heading"');
  });

  it('strips images when allowImages is false', () => {
    expect(
      renderMarkdown('![alt](https://img.test/a.png)', { allowImages: false })
    ).not.toContain('<img');
  });

  it('sanitizes script tags out of the output', () => {
    expect(renderMarkdown('<script>alert(1)</script>')).not.toContain(
      '<script>'
    );
  });
});

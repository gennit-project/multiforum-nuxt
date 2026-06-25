import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { useMarkdownHeadings } from './useMarkdownHeadings';

describe('useMarkdownHeadings', () => {
  it('returns an empty list for empty content', () => {
    expect(useMarkdownHeadings(ref('')).headings.value).toEqual([]);
  });

  it('parses heading levels from the markdown', () => {
    const { headings } = useMarkdownHeadings(ref('# Title\n## Subtitle'));
    expect(headings.value.map((h) => h.level)).toEqual([1, 2]);
  });

  it('builds a url-friendly anchor from the heading text', () => {
    const { headings } = useMarkdownHeadings(ref('# Hello, World!'));
    expect(headings.value[0]?.anchor).toBe('hello-world');
  });

  it('falls back to a heading id anchor when the text has no word chars', () => {
    const { headings } = useMarkdownHeadings(ref('# !!!'));
    expect(headings.value[0]?.anchor).toBe('heading-0');
  });

  it('reacts to content changes', () => {
    const content = ref('# One');
    const { headings } = useMarkdownHeadings(content);
    content.value = '# One\n# Two';
    expect(headings.value).toHaveLength(2);
  });

  it('scrolls to a heading element when present', () => {
    const el = document.createElement('div');
    el.id = 'target';
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);
    useMarkdownHeadings(ref('')).scrollToHeading('target');
    expect(el.scrollIntoView).toHaveBeenCalled();
  });
});

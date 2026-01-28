import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { useMarkdownHeadings } from '@/composables/useMarkdownHeadings';

describe('useMarkdownHeadings', () => {
  it('returns empty list when markdown is empty', () => {
    const markdownContent = ref('');
    const { headings } = useMarkdownHeadings(markdownContent);

    expect(headings.value).toEqual([]);
  });

  it('parses heading levels and text', () => {
    const markdownContent = ref('# Title\n## Subtitle\n### Section');
    const { headings } = useMarkdownHeadings(markdownContent);

    expect(headings.value).toEqual([
      { id: 'heading-0', text: 'Title', level: 1, anchor: 'title' },
      { id: 'heading-1', text: 'Subtitle', level: 2, anchor: 'subtitle' },
      { id: 'heading-2', text: 'Section', level: 3, anchor: 'section' },
    ]);
  });

  it('normalizes punctuation in anchors', () => {
    const markdownContent = ref('## Hello, world! (v2)');
    const { headings } = useMarkdownHeadings(markdownContent);

    expect(headings.value[0]?.anchor).toBe('hello-world-v2');
  });

  it('keeps underscores in anchors', () => {
    const markdownContent = ref('## Heading_with_underscores');
    const { headings } = useMarkdownHeadings(markdownContent);

    expect(headings.value[0]?.anchor).toBe('heading_with_underscores');
  });

  it('falls back to index-based anchor when heading text is empty after cleanup', () => {
    const markdownContent = ref('### !!!');
    const { headings } = useMarkdownHeadings(markdownContent);

    expect(headings.value[0]?.anchor).toBe('heading-0');
  });

  it('allows duplicate anchors for duplicate headings', () => {
    const markdownContent = ref('# Repeat\n## Repeat');
    const { headings } = useMarkdownHeadings(markdownContent);

    expect(headings.value.map((heading) => heading.anchor)).toEqual([
      'repeat',
      'repeat',
    ]);
  });
});

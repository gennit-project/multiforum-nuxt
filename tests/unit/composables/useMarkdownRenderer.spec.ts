import { describe, it, expect } from 'vitest';
import { useMarkdownRenderer } from '@/composables/useMarkdownRenderer';

describe('useMarkdownRenderer', () => {
  const { renderMarkdown } = useMarkdownRenderer();

  describe('basic markdown rendering', () => {
    it('renders paragraph text', () => {
      const result = renderMarkdown('Hello world');

      expect(result).toContain('<p>Hello world</p>');
    });

    it('renders bold text', () => {
      const result = renderMarkdown('**bold**');

      expect(result).toContain('<strong>bold</strong>');
    });

    it('renders italic text', () => {
      const result = renderMarkdown('*italic*');

      expect(result).toContain('<em>italic</em>');
    });

    it('renders unordered lists', () => {
      const result = renderMarkdown('- item 1\n- item 2');

      expect(result).toContain('<ul>');
    });

    it('renders ordered lists', () => {
      const result = renderMarkdown('1. first\n2. second');

      expect(result).toContain('<ol>');
    });
  });

  describe('link handling', () => {
    it('adds target="_blank" to links', () => {
      const result = renderMarkdown('[link](https://example.com)');

      expect(result).toContain('target="_blank"');
    });

    it('adds rel="noopener noreferrer" to links', () => {
      const result = renderMarkdown('[link](https://example.com)');

      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('adds external-link class to links', () => {
      const result = renderMarkdown('[link](https://example.com)');

      expect(result).toContain('class="external-link"');
    });

    it('adds external link icon after links', () => {
      const result = renderMarkdown('[link](https://example.com)');

      expect(result).toContain('class="external-link-icon"');
    });

    it('includes SVG icon in external link icon', () => {
      const result = renderMarkdown('[link](https://example.com)');

      expect(result).toContain('<svg');
    });
  });

  describe('heading anchors', () => {
    it('adds id attribute to h1 headings', () => {
      const result = renderMarkdown('# Hello World');

      expect(result).toContain('id="hello-world"');
    });

    it('adds id attribute to h2 headings', () => {
      const result = renderMarkdown('## Section Title');

      expect(result).toContain('id="section-title"');
    });

    it('adds heading-with-anchor class to headings', () => {
      const result = renderMarkdown('# Title');

      expect(result).toContain('class="heading-with-anchor"');
    });

    it('converts heading text to lowercase for id', () => {
      const result = renderMarkdown('# UPPERCASE');

      expect(result).toContain('id="uppercase"');
    });

    it('replaces spaces with hyphens in heading id', () => {
      const result = renderMarkdown('# Multiple Words Here');

      expect(result).toContain('id="multiple-words-here"');
    });

    it('removes special characters from heading id', () => {
      const result = renderMarkdown('# Hello, World! (v2)');

      expect(result).toContain('id="hello-world-v2"');
    });
  });

  describe('spoiler text', () => {
    it('converts spoiler markup to span with spoiler-text class', () => {
      const result = renderMarkdown('>!secret!<');

      expect(result).toContain('<span class="spoiler-text">secret</span>');
    });

    it('handles spoiler with multiple words', () => {
      const result = renderMarkdown('>!hidden content here!<');

      expect(result).toContain(
        '<span class="spoiler-text">hidden content here</span>'
      );
    });

    it('handles multiple spoilers in same text', () => {
      const result = renderMarkdown('>!first!< and >!second!<');

      expect(result).toContain('<span class="spoiler-text">first</span>');
    });

    it('renders second spoiler when multiple exist', () => {
      const result = renderMarkdown('>!first!< and >!second!<');

      expect(result).toContain('<span class="spoiler-text">second</span>');
    });
  });

  describe('table wrapping', () => {
    it('wraps tables in table-wrapper div', () => {
      const result = renderMarkdown('| A | B |\n|---|---|\n| 1 | 2 |');

      expect(result).toContain('<div class="table-wrapper"><table>');
    });

    it('closes table wrapper properly', () => {
      const result = renderMarkdown('| A | B |\n|---|---|\n| 1 | 2 |');

      expect(result).toContain('</table></div>');
    });
  });

  describe('code blocks', () => {
    it('renders code blocks with pre tag', () => {
      const result = renderMarkdown('```\ncode\n```');

      expect(result).toContain('<pre');
    });

    it('renders code blocks with hljs class', () => {
      const result = renderMarkdown('```\ncode\n```');

      expect(result).toContain('class="hljs');
    });

    it('applies syntax highlighting for javascript', () => {
      const result = renderMarkdown('```javascript\nconst x = 1;\n```');

      expect(result).toContain('<span class="hljs-');
    });

    it('escapes HTML in code blocks without language', () => {
      const result = renderMarkdown('```\n<script>alert("xss")</script>\n```');

      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('HTML passthrough', () => {
    it('allows HTML tags in source', () => {
      const result = renderMarkdown('<div>custom html</div>');

      expect(result).toContain('<div>custom html</div>');
    });
  });

  describe('blockquotes', () => {
    it('renders blockquotes', () => {
      const result = renderMarkdown('> quoted text');

      expect(result).toContain('<blockquote>');
    });
  });
});

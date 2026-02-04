import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';
import type Renderer from 'markdown-it/lib/renderer.mjs';
import hljs from 'highlight.js';
import { generateHeadingId } from '@/utils/markdown';
import { config } from '@/config';

/**
 * Creates and configures a MarkdownIt instance with:
 * - Syntax highlighting via highlight.js
 * - External link handling (target="_blank", rel="noopener noreferrer", icon)
 * - Heading anchors for deep linking
 * - Spoiler text support (>!spoiler text!<)
 * - Table wrapper for responsive scrolling
 */
export function useMarkdownRenderer() {
  const md = new MarkdownIt({
    html: true,
    highlight: (str: string, lang: string): string => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs p-4 text-xs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
        } catch (error) {
          console.warn('Failed to highlight code block', error);
        }
      }
      return `<pre class="hljs p-4 text-xs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    },
  });

  const isExternalHref = (href: string | null | undefined): boolean => {
    if (!href) return false;
    const trimmed = href.trim();
    if (
      trimmed.startsWith('/') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('mailto:')
    ) {
      return false;
    }
    if (config.baseUrl && trimmed.startsWith(config.baseUrl)) {
      return false;
    }
    return /^https?:\/\//i.test(trimmed);
  };

  // Configure renderer to add target="_blank" and rel="noopener noreferrer" to external links
  md.renderer.rules.link_open = (
    tokens: Token[],
    idx: number,
    options: MarkdownIt.Options,
    _env: unknown,
    self: Renderer
  ): string => {
    const token = tokens[idx];
    if (token) {
      const href = token.attrGet('href');
      if (isExternalHref(href)) {
        token.attrPush(['target', '_blank']);
        token.attrPush(['rel', 'noopener noreferrer']);
        token.attrPush(['class', 'external-link']);
        token.attrPush(['data-external', 'true']);
      }
    }
    return self.renderToken(tokens, idx, options);
  };

  // Configure heading renderer to add anchors
  md.renderer.rules.heading_open = (
    tokens: Token[],
    idx: number,
    options: MarkdownIt.Options,
    _env: unknown,
    self: Renderer
  ): string => {
    const token = tokens[idx];

    // Get the heading text from the next token
    const nextToken = tokens[idx + 1];
    const headingText =
      nextToken && nextToken.content ? nextToken.content : `heading-${idx}`;
    const headingId = generateHeadingId(headingText) || `heading-${idx}`;

    if (token) {
      token.attrPush(['id', headingId]);
      token.attrPush(['class', 'heading-with-anchor']);
    }

    return self.renderToken(tokens, idx, options);
  };

  // Add external link icon after the link content
  md.renderer.rules.link_close = (
    tokens: Token[],
    idx: number,
    options: MarkdownIt.Options,
    _env: unknown,
    self: Renderer
  ) => {
    let openToken: Token | undefined;
    for (let i = idx - 1; i >= 0; i -= 1) {
      if (tokens[i]?.type === 'link_open') {
        openToken = tokens[i];
        break;
      }
    }

    if (openToken?.attrGet('data-external') === 'true') {
      return `${self.renderToken(tokens, idx, options)}<span class="external-link-icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span>`;
    }
    return self.renderToken(tokens, idx, options);
  };

  /**
   * Render markdown text to HTML with all configured features.
   * Handles spoiler markup and wraps tables for responsive scrolling.
   */
  function renderMarkdown(text: string): string {
    // Preprocess text to handle spoiler markup before markdown processing
    const preprocessedText = text.replace(
      />!([^!]+)!</g,
      '§SPOILER§$1§/SPOILER§'
    );

    const rawHTML = md.render(preprocessedText);

    // Post-process to convert spoiler placeholders back to HTML
    let processedHTML = rawHTML.replace(
      /§SPOILER§([^§]+)§\/SPOILER§/g,
      '<span class="spoiler-text">$1</span>'
    );

    // Wrap tables in responsive wrapper divs
    processedHTML = processedHTML.replace(
      /<table[^>]*>/gi,
      '<div class="table-wrapper"><table>'
    );
    processedHTML = processedHTML.replace(/<\/table>/gi, '</table></div>');

    return processedHTML;
  }

  return { renderMarkdown };
}

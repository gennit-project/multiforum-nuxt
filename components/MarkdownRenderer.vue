<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { computed, ref } from 'vue';
import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';
import type Renderer from 'markdown-it/lib/renderer.mjs';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

// Helper function to generate heading anchors
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

const slotContainer = ref<HTMLElement | null>(null);

// DOMPurify is not currently used but may be needed for future sanitization

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
  hasSlot: {
    type: Boolean,
    default: false,
  },
  fontSize: {
    type: String,
    default: 'medium',
  },
  imageMaxHeight: {
    type: String,
    default: '350px',
  },
});

const md = new MarkdownIt({
  html: true, // Enable HTML tags in source
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

// Configure renderer to add target="_blank" and rel="noopener noreferrer" to all links
md.renderer.rules.link_open = (
  tokens: Token[],
  idx: number,
  options: MarkdownIt.Options,
  _env: unknown,
  self: Renderer
): string => {
  const token = tokens[idx];
  if (token) {
    token.attrPush(['target', '_blank']);
    token.attrPush(['rel', 'noopener noreferrer']);
    token.attrPush(['class', 'external-link']);
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
md.renderer.rules.link_close = () => {
  return '</a><span class="external-link-icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span>';
};

const renderedMarkdown = computed(() => {
  // Preprocess text to handle spoiler markup before markdown processing
  const preprocessedText = props.text.replace(
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

  // Always return the processed HTML - DOMPurify is handled separately for hydration
  return processedHTML;
});

const containerStyle = computed(() => {
  return {
    '--image-max-height': props.imageMaxHeight,
  };
});
</script>

<template>
  <div class="markdown-container" :style="containerStyle">
    <!-- Use both classes and inline styles to ensure font size is applied -->
    <div
      ref="slotContainer"
      class="markdown-body"
      :class="{
        'font-size-small': props.fontSize === 'small',
        'font-size-medium': props.fontSize === 'medium',
        'font-size-large': props.fontSize === 'large',
      }"
      v-html="renderedMarkdown"
    />
    <div v-if="$slots.default" class="inline-slot">
      <slot />
    </div>
  </div>
</template>

<style lang="scss">
/* ---------- layout wrappers ---------- */
.markdown-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;

  .markdown-body {
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 70ch; /* Optimal line length for readability */
    box-sizing: border-box;
    color: #24292f !important; /* Explicit text color for light mode */

    .dark & {
      color: #e6edf3 !important; /* Explicit text color for dark mode */
    }

    /* ── font‑size variants ─────────────────────────────── */
    &.font-size-small {
      h1 {
        font-size: 1.5rem !important;
        letter-spacing: -0.02em !important;
      }
      h2 {
        font-size: 1.25rem !important;
        letter-spacing: -0.015em !important;
      }
      h3 {
        font-size: 1.1rem !important;
        letter-spacing: -0.01em !important;
      }
      h4 {
        font-size: 1rem !important;
      }
      h5,
      h6 {
        font-size: 0.9rem !important;
      }
      p,
      li {
        font-size: 0.9rem !important;
      }
    }

    &.font-size-medium {
      h1 {
        font-size: 1.875rem !important;
        letter-spacing: -0.025em !important;
      }
      h2 {
        font-size: 1.5rem !important;
        letter-spacing: -0.02em !important;
      }
      h3 {
        font-size: 1.25rem !important;
        letter-spacing: -0.015em !important;
      }
      h4 {
        font-size: 1.1rem !important;
      }
      h5,
      h6 {
        font-size: 1rem !important;
      }
      p,
      li {
        font-size: 1rem !important;
      }
    }

    &.font-size-large {
      h1 {
        font-size: 2.25rem !important;
        letter-spacing: -0.03em !important;
      }
      h2 {
        font-size: 1.75rem !important;
        letter-spacing: -0.025em !important;
      }
      h3 {
        font-size: 1.375rem !important;
        letter-spacing: -0.02em !important;
      }
      h4 {
        font-size: 1.2rem !important;
      }
      h5,
      h6 {
        font-size: 1.1rem !important;
      }
      p,
      li {
        font-size: 1.125rem !important;
      }
    }

    /* ── general typography & elements ───────────────────── */
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      font-weight: 600 !important;
      margin-top: 1.75rem !important;
      margin-bottom: 0.75rem !important;
      line-height: 1.3 !important;

      &:first-child {
        margin-top: 0 !important;
      }
    }

    p {
      margin-bottom: 1.25rem !important;
      margin-top: 0 !important;
      line-height: 1.65 !important;
    }

    ul,
    ol {
      padding-left: 1.75rem !important;
      margin-bottom: 1.25rem !important;
      margin-top: 0 !important;
    }

    ul {
      list-style-type: disc !important;
    }

    ol {
      list-style-type: decimal !important;
    }

    li {
      margin: 0 !important;
      padding: 0 !important;
      line-height: 1.65 !important;

      /* Remove paragraph margins inside list items */
      p {
        margin: 0 !important;
        padding: 0 !important;
      }
    }

    /* Nested list styling with different bullet types */
    ul ul {
      list-style-type: circle !important;
      margin-top: 0.25rem !important;
      margin-bottom: 0 !important;
    }

    ul ul ul {
      list-style-type: square !important;
    }

    ol ol,
    ul ol,
    ol ul {
      margin-top: 0.25rem !important;
      margin-bottom: 0 !important;
    }

    pre {
      border-radius: 6px !important;
      overflow-x: auto !important; // keep horizontal scroll for code blocks
      padding: 1rem !important;
      max-width: 100% !important;
      white-space: pre-wrap !important;
      margin-bottom: 1rem !important;

      background-color: #161b22 !important;
      border-color: #30363d !important;
    }

    code {
      font-family:
        SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace !important;
      padding: 0.2em 0.4em !important;
      margin: 0 !important;
      border-radius: 6px !important;
      max-width: 100% !important;
      overflow-wrap: break-word !important;
      white-space: pre-wrap !important;
    }

    pre code {
      padding: 0 !important;
      background-color: transparent !important;
    }

    a {
      color: #0969da !important;
      text-decoration: none !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      max-width: 100% !important;
      word-break: break-word !important;
      display: inline-block !important;

      &:hover {
        text-decoration: underline !important;
      }

      .dark & {
        color: #58a6ff !important;
      }
    }

    img {
      margin-top: 1rem !important;
      max-height: var(--image-max-height, 350px) !important;
      max-width: 100% !important;
      height: auto !important;
      width: auto !important;
      object-fit: contain !important;
      cursor: pointer !important;
      display: block !important;
      word-wrap: break-word !important;
    }

    blockquote {
      padding: 0.6em 1em !important;
      border-left: 0.25em solid #d0d7de !important;
      margin: 1em 0 !important;
      color: #57606a !important;
      background-color: #f6f8fa !important;
      border-radius: 0 6px 6px 0 !important;

      .dark & {
        border-left-color: #30363d !important;
        color: #8b949e !important;
        background-color: #161b22 !important;
      }

      > :first-child {
        margin-top: 0 !important;
      }

      > :last-child {
        margin-bottom: 0 !important;
      }
    }

    /* ── spoiler text ───────────────────────────────────── */
    .spoiler-text {
      background-color: #000 !important;
      color: #000 !important;
      padding: 0.1em 0.2em !important;
      border-radius: 3px !important;
      cursor: pointer !important;
      user-select: none !important;

      &:hover {
        background-color: transparent !important;
        color: inherit !important;
      }

      .dark & {
        background-color: #6b7280 !important;
        color: #6b7280 !important;

        &:hover {
          background-color: transparent !important;
          color: inherit !important;
        }
      }
    }

    /* ── kbd (keyboard) styling ─────────────────────────── */
    kbd {
      display: inline-block !important;
      padding: 0.2em 0.4em !important;
      margin: 0 0.1em !important;
      font-family:
        SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace !important;
      font-size: 0.85em !important;
      line-height: 1 !important;
      color: #24292f !important;
      background-color: #f6f8fa !important;
      border: 1px solid #d0d7de !important;
      border-radius: 6px !important;
      box-shadow: inset 0 -1px 0 #d0d7de !important;
      vertical-align: middle !important;
      white-space: nowrap !important;

      .dark & {
        color: #f0f6fc !important;
        background-color: #21262d !important;
        border-color: #30363d !important;
        box-shadow: inset 0 -1px 0 #30363d !important;
      }
    }

    /* ── table styling ──────────────────────────────────── */
    .table-wrapper {
      overflow-x: auto !important;
      margin: 1rem 0 !important;
      border-radius: 6px !important;
      border: 1px solid #d0d7de !important;

      .dark & {
        border-color: #30363d !important;
      }

      /* Webkit scrollbar styling */
      &::-webkit-scrollbar {
        height: 8px !important;
      }

      &::-webkit-scrollbar-track {
        background: #f1f1f1 !important;
        border-radius: 4px !important;

        .dark & {
          background: #2d2d2d !important;
        }
      }

      &::-webkit-scrollbar-thumb {
        background: #c1c1c1 !important;
        border-radius: 4px !important;

        &:hover {
          background: #a8a8a8 !important;
        }

        .dark & {
          background: #555 !important;

          &:hover {
            background: #777 !important;
          }
        }
      }
    }

    table {
      border-collapse: collapse !important;
      border-spacing: 0 !important;
      width: 100% !important;
      min-width: 600px !important; /* Minimum width to prevent cramping */
      margin: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      overflow: visible !important;

      /* On mobile, allow table to be smaller but still scrollable */
      @media (max-width: 768px) {
        min-width: 500px !important;
      }

      @media (max-width: 480px) {
        min-width: 400px !important;
      }
    }

    thead {
      background-color: #f6f8fa !important;

      .dark & {
        background-color: #21262d !important;
      }
    }

    th {
      padding: 0.75rem 1rem !important;
      text-align: left !important;
      font-weight: 600 !important;
      font-size: 0.8rem !important;
      border-bottom: 1px solid #d0d7de !important;
      border-right: 1px solid #d0d7de !important;
      background-color: #f6f8fa !important;

      &:last-child {
        border-right: none !important;
      }

      .dark & {
        border-color: #30363d !important;
        background-color: #21262d !important;
        color: #f0f6fc !important;
      }
    }

    td {
      padding: 0.75rem 1rem !important;
      font-size: 0.8rem !important;
      border-bottom: 1px solid #d0d7de !important;
      border-right: 1px solid #d0d7de !important;

      &:last-child {
        border-right: none !important;
      }

      .dark & {
        border-color: #30363d !important;
      }
    }

    tr {
      &:last-child {
        td {
          border-bottom: none !important;
        }
      }

      &:hover {
        background-color: #f6f8fa !important;

        .dark & {
          background-color: #161b22 !important;
        }
      }
    }

    /* ── external‑link helper ───────────────────────────── */
    .external-link {
      display: inline-flex;
      align-items: center;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .external-link-icon {
      color: #0969da !important;
      display: inline-flex !important;
      align-items: center !important;
      margin-left: 4px !important;
      opacity: 0.6 !important;

      svg {
        width: 12px !important;
        height: 12px !important;
      }

      .dark & {
        color: #58a6ff !important;
      }
    }

    /* ── theme hack for code‑theme background ───────────── */
    .dark {
      background-color: transparent;
    }
  }

  .inline-slot {
    display: inline-flex;
    align-items: center;
    margin-left: 8px;
    align-self: baseline;

    // tweak button alignment with text
    button {
      margin-top: -4px;
    }
  }
}

/* ---------- markdown styles ---------- */
.markdown-body {
  word-wrap: break-word;
  overflow-wrap: break-word;
  width: 100%;
  max-width: 70ch; /* Optimal line length for readability */
  color: #24292f; /* Explicit text color for light mode */

  .dark & {
    color: #e6edf3; /* Explicit text color for dark mode */
  }

  /* ── font‑size variants ─────────────────────────────── */
  &.font-size-small {
    h1 {
      font-size: 1.5rem !important;
      letter-spacing: -0.02em !important;
    }
    h2 {
      font-size: 1.25rem !important;
      letter-spacing: -0.015em !important;
    }
    h3 {
      font-size: 1.1rem !important;
      letter-spacing: -0.01em !important;
    }
    h4 {
      font-size: 1rem !important;
    }
    h5,
    h6 {
      font-size: 0.9rem !important;
    }
    p,
    li {
      font-size: 0.9rem !important;
    }
  }

  &.font-size-medium {
    h1 {
      font-size: 1.875rem !important;
      letter-spacing: -0.025em !important;
    }
    h2 {
      font-size: 1.5rem !important;
      letter-spacing: -0.02em !important;
    }
    h3 {
      font-size: 1.25rem !important;
      letter-spacing: -0.015em !important;
    }
    h4 {
      font-size: 1.1rem !important;
    }
    h5,
    h6 {
      font-size: 1rem !important;
    }
    p,
    li {
      font-size: 1rem !important;
    }
  }

  &.font-size-large {
    h1 {
      font-size: 2.25rem !important;
      letter-spacing: -0.03em !important;
    }
    h2 {
      font-size: 1.75rem !important;
      letter-spacing: -0.025em !important;
    }
    h3 {
      font-size: 1.375rem !important;
      letter-spacing: -0.02em !important;
    }
    h4 {
      font-size: 1.2rem !important;
    }
    h5,
    h6 {
      font-size: 1.1rem !important;
    }
    p,
    li {
      font-size: 1.125rem !important;
    }
  }

  /* ── general typography & elements ───────────────────── */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-weight: 600 !important;
    margin-top: 1.75rem !important;
    margin-bottom: 0.75rem !important;
    line-height: 1.3 !important;

    &:first-child {
      margin-top: 0 !important;
    }
  }

  p {
    margin-bottom: 1.25rem !important;
    margin-top: 0 !important;
    line-height: 1.65 !important;
  }

  ul,
  ol {
    padding-left: 1.75rem !important;
    margin-bottom: 1.25rem !important;
    margin-top: 0 !important;
  }

  ul {
    list-style-type: disc !important;
  }

  ol {
    list-style-type: decimal !important;
  }

  li {
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1.65 !important;

    /* Remove paragraph margins inside list items */
    p {
      margin: 0 !important;
      padding: 0 !important;
    }
  }

  /* Nested list styling with different bullet types */
  ul ul {
    list-style-type: circle !important;
    margin-top: 0.25rem !important;
    margin-bottom: 0 !important;
  }

  ul ul ul {
    list-style-type: square !important;
  }

  ol ol,
  ul ol,
  ol ul {
    margin-top: 0.25rem !important;
    margin-bottom: 0 !important;
  }

  pre {
    border-radius: 6px;
    overflow-x: auto; // keep horizontal scroll for code blocks
    padding: 1rem !important;
    max-width: 100%;
    white-space: pre-wrap;
    margin-bottom: 1.25rem !important;
  }

  code {
    border-radius: 6px;
    padding: 0.2em 0.4em !important;
    max-width: 100%;
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }

  pre code {
    padding: 0 !important;
  }

  a {
    color: #0969da !important;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
    word-break: break-word;
    display: inline;

    &:hover {
      text-decoration: underline !important;
    }

    .dark & {
      color: #58a6ff !important;
    }
  }

  img {
    margin-top: 1rem !important;
    max-height: var(--image-max-height, 350px) !important;
    max-width: 100% !important;
    height: auto !important;
    width: auto !important;
    object-fit: contain !important;
    cursor: pointer !important;
    display: block !important;
    word-wrap: break-word !important;
  }

  blockquote {
    padding: 0.6em 1em !important;
    border-left: 0.25em solid #d0d7de !important;
    margin: 1.25rem 0 !important;
    color: #57606a !important;
    background-color: #f6f8fa !important;
    border-radius: 0 6px 6px 0 !important;

    .dark & {
      border-left-color: #30363d !important;
      color: #8b949e !important;
      background-color: #161b22 !important;
    }

    > :first-child {
      margin-top: 0 !important;
    }

    > :last-child {
      margin-bottom: 0 !important;
    }
  }

  /* ── spoiler text ───────────────────────────────────── */
  .spoiler-text {
    background-color: #000 !important;
    color: #000 !important;
    padding: 0.1em 0.2em !important;
    border-radius: 3px !important;
    cursor: pointer !important;
    user-select: none !important;

    &:hover {
      background-color: transparent !important;
      color: inherit !important;
    }

    .dark & {
      background-color: #6b7280 !important;
      color: #6b7280 !important;

      &:hover {
        background-color: transparent !important;
        color: inherit !important;
      }
    }
  }

  /* ── kbd (keyboard) styling ─────────────────────────── */
  kbd {
    display: inline-block !important;
    padding: 0.2em 0.4em !important;
    margin: 0 0.1em !important;
    font-family:
      SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace !important;
    font-size: 0.85em !important;
    line-height: 1 !important;
    color: #24292f !important;
    background-color: #f6f8fa !important;
    border: 1px solid #d0d7de !important;
    border-radius: 6px !important;
    box-shadow: inset 0 -1px 0 #d0d7de !important;
    vertical-align: middle !important;
    white-space: nowrap !important;

    .dark & {
      color: #f0f6fc !important;
      background-color: #21262d !important;
      border-color: #30363d !important;
      box-shadow: inset 0 -1px 0 #30363d !important;
    }
  }

  /* ── table styling ──────────────────────────────────── */
  .table-wrapper {
    overflow-x: auto !important;
    margin: 1rem 0 !important;
    border-radius: 6px !important;
    border: 1px solid #d0d7de !important;

    .dark & {
      border-color: #30363d !important;
    }

    /* Webkit scrollbar styling */
    &::-webkit-scrollbar {
      height: 8px !important;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1 !important;
      border-radius: 4px !important;

      .dark & {
        background: #2d2d2d !important;
      }
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1 !important;
      border-radius: 4px !important;

      &:hover {
        background: #a8a8a8 !important;
      }

      .dark & {
        background: #555 !important;

        &:hover {
          background: #777 !important;
        }
      }
    }
  }

  table {
    border-collapse: collapse !important;
    border-spacing: 0 !important;
    width: 100% !important;
    min-width: 600px !important; /* Minimum width to prevent cramping */
    margin: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    overflow: visible !important;

    /* On mobile, allow table to be smaller but still scrollable */
    @media (max-width: 768px) {
      min-width: 500px !important;
    }

    @media (max-width: 480px) {
      min-width: 400px !important;
    }
  }

  thead {
    background-color: #f6f8fa !important;

    .dark & {
      background-color: #21262d !important;
    }
  }

  th {
    padding: 0.75rem 1rem !important;
    text-align: left !important;
    font-weight: 600 !important;
    font-size: 0.8rem !important;
    border-bottom: 1px solid #d0d7de !important;
    border-right: 1px solid #d0d7de !important;
    background-color: #f6f8fa !important;

    &:last-child {
      border-right: none !important;
    }

    .dark & {
      border-color: #30363d !important;
      background-color: #21262d !important;
      color: #f0f6fc !important;
    }
  }

  td {
    padding: 0.75rem 1rem !important;
    font-size: 0.8rem !important;
    border-bottom: 1px solid #d0d7de !important;
    border-right: 1px solid #d0d7de !important;

    &:last-child {
      border-right: none !important;
    }

    .dark & {
      border-color: #30363d !important;
    }
  }

  tr {
    &:last-child {
      td {
        border-bottom: none !important;
      }
    }

    &:hover {
      background-color: #f6f8fa !important;

      .dark & {
        background-color: #161b22 !important;
      }
    }
  }

  /* ── external‑link helper ───────────────────────────── */
  .external-link {
    display: inline-flex;
    align-items: center;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .external-link-icon {
    color: #3182ce !important;
    display: inline-flex;
    align-items: center;
    margin-left: 4px;
    opacity: 0.6;

    svg {
      width: 14px;
      height: 14px;
    }
  }

  /* ── theme hack for code‑theme background ───────────── */
  .dark {
    background-color: transparent;
  }
}
</style>

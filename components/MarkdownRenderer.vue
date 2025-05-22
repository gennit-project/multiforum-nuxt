<script setup lang="ts">
  /* eslint-disable vue/no-v-html */
  import { computed, ref } from "vue";
  import MarkdownIt from "markdown-it";
  import hljs from "highlight.js";
  import "highlight.js/styles/github-dark.css";

  const slotContainer = ref<HTMLElement | null>(null);

  // Use DOMPurify only in the client environment
  let DOMPurify: typeof import("dompurify");

  if (import.meta.client) {
    DOMPurify = (await import("dompurify")).default;
  }

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
      default: "medium",
    },
  });

  const md = new MarkdownIt({
    highlight: (str, lang): any => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs p-4 text-xs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
        } catch (error) {
          console.warn("Failed to highlight code block", error);
        }
      }
      return `<pre class="hljs p-4 text-xs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    },
  });

  // Configure renderer to add target="_blank" and rel="noopener noreferrer" to all links
  md.renderer.rules.link_open = (tokens: any, idx: number, options: any, env: any, self: any) => {
    const token = tokens[idx];
    token.attrPush(["target", "_blank"]);
    token.attrPush(["rel", "noopener noreferrer"]);
    token.attrPush(["class", "external-link"]);
    return self.renderToken(tokens, idx, options);
  };

  // Add external link icon after the link content
  md.renderer.rules.link_close = () => {
    return '</a><span class="external-link-icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span>';
  };

  const renderedMarkdown = computed(() => {
    const rawHTML = md.render(props.text);

    if (import.meta.client && DOMPurify) {
      // Configure DOMPurify to allow target="_blank" attribute
      const config = {
        ADD_ATTR: ["target", "rel"],
        ADD_TAGS: ["svg", "path", "polyline", "line"],
      };
      return DOMPurify.sanitize(rawHTML, config);
    }
    return rawHTML; // Return the raw HTML if on the server
  });
</script>

<template>
  <div class="markdown-container">
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
    <div
      v-if="$slots.default"
      class="inline-slot"
    >
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
      max-width: 100%;
      box-sizing: border-box;

      // allow last paragraph to flow with the slotted element
      &:last-child > p:last-child {
        display: inline;
        margin-right: 6px;
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

    /* ── font‑size variants ─────────────────────────────── */
    &.font-size-small {
      h1 {
        font-size: 1rem !important;
      }
      h2 {
        font-size: 0.9rem !important;
      }
      p,
      li {
        font-size: 0.8rem !important;
      }
    }

    &.font-size-medium {
      h1 {
        font-size: 1.1rem !important;
      }
      h2 {
        font-size: 1rem !important;
      }
      p,
      li {
        font-size: 0.9rem !important;
      }
    }

    &.font-size-large {
      h1 {
        font-size: 1.4rem !important;
      }
      h2 {
        font-size: 1.3rem !important;
      }
      p,
      li {
        font-size: 1.1rem !important;
      }
    }

    /* ── general typography & elements ───────────────────── */
    h1,
    h2 {
      font-size: 1rem !important;
      font-weight: 600 !important;
      margin-top: 1.5rem !important;
      margin-bottom: 1rem !important;
    }

    p {
      margin-bottom: 1rem !important;
      margin-top: 0.25rem !important;
      line-height: 1.5 !important;
    }

    ul,
    ol {
      padding-left: 2rem !important;
      margin-bottom: 1rem !important;
      margin-top: 0 !important;
    }
    
    ul {
      list-style-type: disc !important;
    }
    
    ol {
      list-style-type: decimal !important;
    }
    
    li {
      margin: 0.25rem 0 !important;
      line-height: 1.5 !important;
    }
    
    ul ul,
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
      background-color: #f6f8fa !important;
      border: 1px solid #e1e4e8 !important;
      
      .dark & {
        background-color: #161b22 !important;
        border-color: #30363d !important;
      }
    }

    code {
      font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace !important;
      padding: 0.2em 0.4em !important;
      margin: 0 !important;
      border-radius: 6px !important;
      max-width: 100% !important;
      overflow-wrap: break-word !important;
      white-space: pre-wrap !important;
      background-color: rgba(175, 184, 193, 0.2) !important;
      
      .dark & {
        background-color: rgba(110, 118, 129, 0.4) !important;
      }
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
      max-height: 350px !important;
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
</style>

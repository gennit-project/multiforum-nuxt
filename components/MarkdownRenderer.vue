<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { computed } from "vue";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { useTheme } from "@/composables/useTheme";

const { theme } = useTheme();

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
});

const md = new MarkdownIt({
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs p-4 text-xs"><code>${hljs.highlight(lang, str, true).value}</code></pre>`;
      } catch {
        console.warn("Failed to highlight code block");
      }
    }
    return "";
  },
});

// Configure renderer to add target="_blank" and rel="noopener noreferrer" to all links
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
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
  <div :class="['markdown-body', theme]" v-html="renderedMarkdown" />
</template>

<style lang="scss">
.markdown-body {
  padding-left: 20px;
  padding-top: 1px;
  padding-bottom: 0.25rem !important;
  word-wrap: break-word;
  overflow-wrap: break-word;

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
    color: currentColor;
    opacity: 0.6;

    svg {
      width: 14px;
      height: 14px;
    }
  }

  .dark {
    background-color: transparent;
  }

  h1 {
    font-size: 1.25rem !important;
    font-weight: 600 !important;
    margin-top: 1.5rem !important;
    margin-bottom: 1rem !important;
  }

  h2 {
    font-size: 1rem !important;
    font-weight: 600 !important;
    margin-top: 1.5rem !important;
    margin-bottom: 1rem !important;
  }

  p,
  li {
    font-size: 0.9rem !important;
    font-weight: 400 !important;
  }
  ul,
  ol {
    list-style-type: disc !important;
    margin-left: 1rem !important;
    margin-bottom: 0.5rem !important;
  }

  p {
    margin-bottom: 0.5rem !important;
  }
  pre,
  code {
    border-radius: 5px;
    overflow-x: auto; // Keep horizontal scroll for code blocks
    padding-bottom: 0.25rem !important;
  }
  a {
    color: #3182ce !important;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
    word-break: break-all;
  }
  img {
    max-height: 350px !important;
    max-width: 100% !important;
    height: auto !important;
    width: auto !important;
    object-fit: contain !important;
    cursor: pointer !important;
    display: block !important;
    margin-left: auto !important;
    margin-right: auto !important;
    word-wrap: break-word !important;
  }

  blockquote {
    border-left: 4px solid #3182ce;
    padding-left: 16px;
    margin: 16px 0;
    font-style: italic;
    color: #555;

    .dark & {
      border-left-color: #63b3ed;
      color: #ccc;
    }
  }
}
</style>

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
  // Add target="_blank" and security attributes to link tokens
  token.attrPush(["target", "_blank"]);
  token.attrPush(["rel", "noopener noreferrer"]);
  return self.renderToken(tokens, idx, options);
};

const renderedMarkdown = computed(() => {
  const rawHTML = md.render(props.text);

  if (import.meta.client && DOMPurify) {
    // Configure DOMPurify to allow target="_blank" attribute
    const config = {
      ADD_ATTR: ["target", "rel"],
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

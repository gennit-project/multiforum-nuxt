<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { computed } from "vue";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import { useQuery } from "@vue/apollo-composable";
import gql from "graphql-tag";
import 'highlight.js/styles/github-dark.css';

// Use DOMPurify only in the client environment
let DOMPurify;
if (import.meta.client) {
  DOMPurify = (await import('dompurify')).default;
}

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
});

const GET_THEME = gql`
  query getTheme {
    theme @client
  }
`;

const {
  result: themeResult,
  loading: themeLoading,
  error: themeError,
} = useQuery(GET_THEME);

const theme = computed(() => {
  if (themeLoading.value || themeError.value) {
    return "";
  }
  return themeResult.value?.theme || "";
});

const md = new MarkdownIt({
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs p-4"><code>${hljs.highlight(lang, str, true).value}</code></pre>`;
      } catch {
        console.warn("Failed to highlight code block");
      }
    }
    return ""; 
  },
});

const renderedMarkdown = computed(() => {
  const rawHTML = md.render(props.text);

  if (import.meta.client && DOMPurify) {
    return DOMPurify.sanitize(rawHTML);
  }
  return rawHTML; // Return the raw HTML if on the server
});
</script>

<template>
  <div :class="['markdown-body', theme]" v-html="renderedMarkdown" />
</template>

<style lang="scss">
.markdown-body {
  padding: 16px;
  overflow-x: auto;

  .dark {
    background-color: transparent;
  }

  pre,
  code {
    border-radius: 5px;
    overflow-x: auto;
  }

  img {
    max-width: 100%;
    max-height: 400px;
    height: auto;
  }

  a {
    color: #3182ce !important;
  }
}
</style>

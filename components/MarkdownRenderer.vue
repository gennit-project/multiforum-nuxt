<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { computed, onServerPrefetch, ref, watch } from 'vue';
import 'highlight.js/styles/github-dark.css';
import { useMarkdownRenderer } from '@/composables/useMarkdownRenderer';
import {
  loadCodeHighlighter,
  needsCodeHighlighter,
} from '@/utils/codeHighlighter';

const slotContainer = ref<HTMLElement | null>(null);

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
  allowImages: {
    type: Boolean,
    default: true,
  },
});

const { renderMarkdown } = useMarkdownRenderer();

// Only bodies with a fenced code block pay for highlight.js. SSR waits for it
// so the server HTML is highlighted; on the client the SSR markup is kept
// through hydration (Vue does not diff v-html), and a client-only render shows
// plain code until the module arrives, then re-renders highlighted.
const needsHighlighter = computed(() => needsCodeHighlighter(props.text));

const loadHighlighterIfNeeded = async () => {
  if (!needsHighlighter.value) return;
  try {
    await loadCodeHighlighter();
  } catch (error) {
    console.warn('Failed to load code highlighter', error);
  }
};

onServerPrefetch(loadHighlighterIfNeeded);
watch(needsHighlighter, loadHighlighterIfNeeded, { immediate: true });

const renderedMarkdown = computed(() =>
  renderMarkdown(props.text, { allowImages: props.allowImages })
);

const containerStyle = computed(() => {
  return {
    '--image-max-height': props.imageMaxHeight,
  };
});
</script>

<template>
  <div class="markdown-container" :style="containerStyle">
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
@use '@/assets/css/markdown-body.scss' as *;
</style>

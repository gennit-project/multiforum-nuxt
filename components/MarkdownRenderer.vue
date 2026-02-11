<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { computed, ref } from 'vue';
import 'highlight.js/styles/github-dark.css';
import { useMarkdownRenderer } from '@/composables/useMarkdownRenderer';

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
});

const { renderMarkdown } = useMarkdownRenderer();

const renderedMarkdown = computed(() => renderMarkdown(props.text));

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

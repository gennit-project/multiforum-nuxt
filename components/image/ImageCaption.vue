<script setup lang="ts">
import MarkdownPreview from '@/components/MarkdownPreview.vue';

defineProps({
  text: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="image-caption">
    <MarkdownPreview
      :text="text"
      :show-show-more="false"
      :disable-gallery="true"
    />
  </div>
</template>

<style scoped>
.image-caption :deep(.markdown-body) {
  max-width: 100%;
  color: inherit !important;
}

.image-caption :deep(.markdown-body h1),
.image-caption :deep(.markdown-body h2),
.image-caption :deep(.markdown-body h3),
.image-caption :deep(.markdown-body h4),
.image-caption :deep(.markdown-body h5),
.image-caption :deep(.markdown-body h6),
.image-caption :deep(.markdown-body p),
.image-caption :deep(.markdown-body li) {
  font-size: inherit !important;
}

.image-caption :deep(.markdown-body > :last-child) {
  margin-bottom: 0 !important;
}
</style>

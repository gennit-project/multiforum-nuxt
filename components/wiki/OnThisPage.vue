<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { useMarkdownHeadings } from '@/composables/useMarkdownHeadings';

const props = defineProps<{
  markdownContent: string;
}>();

const markdownRef = ref(props.markdownContent);

// Watch for prop changes
watchEffect(() => {
  markdownRef.value = props.markdownContent;
});

const { headings, scrollToHeading } = useMarkdownHeadings(markdownRef);

// Filter headings to only show relevant levels (h1-h4)
const filteredHeadings = computed(() => {
  return headings.value.filter((heading) => heading.level <= 4);
});

// Handle click on heading link
const handleHeadingClick = (anchor: string) => {
  scrollToHeading(anchor);
};
</script>

<template>
  <div v-if="filteredHeadings.length > 0">
    <div
      class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-500 dark:bg-gray-800"
    >
      <h3
        class="font-semibold mb-4 text-sm uppercase tracking-wide text-gray-900 dark:text-white"
      >
        On This Page
      </h3>
      <nav class="space-y-1">
        <button
          v-for="heading in filteredHeadings"
          :key="heading.id"
          @click="handleHeadingClick(heading.anchor)"
          :class="[
            'hover:bg-orange-50 block w-full rounded px-2 py-1 text-left text-sm transition-colors hover:text-orange-700 dark:hover:bg-orange-900/20 dark:hover:text-orange-300',
            {
              'pl-2': heading.level === 1,
              'pl-4': heading.level === 2,
              'pl-6': heading.level === 3,
              'pl-8': heading.level === 4,
              'text-gray-700 dark:text-gray-300': true,
              'font-medium': heading.level === 1,
              'font-normal': heading.level > 1,
            },
          ]"
        >
          {{ heading.text }}
        </button>
      </nav>
    </div>
  </div>
</template>

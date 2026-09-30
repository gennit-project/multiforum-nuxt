<script setup lang="ts">
import { computed, ref, watchEffect, onMounted, onUnmounted } from 'vue';
import { useMarkdownHeadings } from '@/composables/useMarkdownHeadings';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';

const props = defineProps<{
  markdownContent: string;
  isMobile?: boolean;
}>();

const markdownRef = ref(props.markdownContent);
const isDropdownOpen = ref(false);
const activeHeading = ref<string>('');

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
  // Update URL hash
  if (typeof window !== 'undefined') {
    window.history.replaceState(null, '', `#${anchor}`);
  }
  activeHeading.value = anchor;
  // Close dropdown on mobile
  if (props.isMobile) {
    isDropdownOpen.value = false;
  }
};

// Scroll spy functionality
const updateActiveHeading = () => {
  if (typeof window === 'undefined') return;

  const headingElements = filteredHeadings.value
    .map((heading) => document.getElementById(heading.anchor))
    .filter(Boolean);

  if (headingElements.length === 0) return;

  const scrollPosition = window.scrollY + 100; // Offset for header

  for (let i = headingElements.length - 1; i >= 0; i--) {
    const element = headingElements[i];
    if (element && element.offsetTop <= scrollPosition) {
      const anchor = element.id;
      if (activeHeading.value !== anchor) {
        activeHeading.value = anchor;
      }
      break;
    }
  }
};

// Set up scroll listener
onMounted(() => {
  if (typeof window !== 'undefined') {
    // Set initial active heading from URL hash
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      activeHeading.value = hash;
    }

    window.addEventListener('scroll', updateActiveHeading, { passive: true });
    // Initial check
    updateActiveHeading();
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', updateActiveHeading);
  }
});

// Toggle dropdown
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};
</script>

<template>
  <div v-if="filteredHeadings.length > 0">
    <!-- Mobile Dropdown -->
    <div v-if="isMobile" v-click-outside="closeDropdown" class="relative">
      <button
        type="button"
        aria-haspopup="menu"
        :aria-expanded="isDropdownOpen"
        :class="[
          'flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
        ]"
        @click="toggleDropdown"
      >
        <span>On This Page</span>
        <ChevronDownIcon
          :class="[
            'h-4 w-4 transition-transform duration-200',
            { 'rotate-180': isDropdownOpen },
          ]"
          aria-hidden="true"
        />
      </button>

      <div
        v-if="isDropdownOpen"
        class="absolute top-full right-0 left-0 z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
      >
        <nav class="max-h-64 overflow-y-auto p-2" aria-label="On this page">
          <button
            v-for="heading in filteredHeadings"
            :key="heading.id"
            :class="[
              'hover:bg-brand-50 dark:hover:bg-brand-900/20 block w-full rounded px-2 py-1.5 text-left text-sm transition-colors',
              {
                'pl-2': heading.level === 1,
                'pl-4': heading.level === 2,
                'pl-6': heading.level === 3,
                'pl-8': heading.level === 4,
                'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300':
                  activeHeading === heading.anchor,
                'hover:text-brand-700 dark:hover:text-brand-300 text-gray-600 dark:text-gray-400':
                  activeHeading !== heading.anchor,
                'font-medium': heading.level === 1,
                'font-normal': heading.level > 1,
              },
            ]"
            @click="handleHeadingClick(heading.anchor)"
          >
            {{ heading.text }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Desktop Sidebar -->
    <div v-else class="py-2">
      <h3
        class="mb-3 text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
      >
        On This Page
      </h3>
      <nav class="space-y-1" aria-label="On this page">
        <button
          v-for="heading in filteredHeadings"
          :key="heading.id"
          :class="[
            'hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/20 dark:hover:text-brand-300 block w-full rounded px-1 py-0.5 text-left text-xs transition-colors',
            {
              'pl-1': heading.level === 1,
              'pl-3': heading.level === 2,
              'pl-5': heading.level === 3,
              'pl-7': heading.level === 4,
              'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300':
                activeHeading === heading.anchor,
              'text-gray-600 dark:text-gray-400':
                activeHeading !== heading.anchor,
              'font-medium': heading.level === 1,
              'font-normal': heading.level > 1,
            },
          ]"
          @click="handleHeadingClick(heading.anchor)"
        >
          {{ heading.text }}
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'nuxt/app';

const props = defineProps({
  count: {
    type: Number,
    default: 0,
  },
  to: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  vertical: {
    type: Boolean,
    default: false,
  },
  showCount: {
    type: Boolean,
    default: false,
  },
  dataTestid: {
    type: String,
    default: '',
  },
});

const route = useRoute(); // Access the current route

// Compute active state based on the current route
const isActive = computed(() => {
  return route.path === props.to;
});

const classes = computed(() => ({
  'border-black dark:border-blue-500 dark:text-gray-100': isActive.value,
  'bg-gray-100 dark:bg-gray-700 pr-2 px-4 text-gray-700': isActive.value && props.vertical,
  'border-b-2 dark:text-gray-400 dark:border-blue-500': isActive.value && !props.vertical,
  'text-gray-500 border-white dark:border-gray-800': !isActive.value,
  'pr-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-700': !isActive.value && props.vertical,
  'border-b-2 border-transparent': !isActive.value && !props.vertical,
}));

const isHovered = ref(false);
</script>

<template>
  <nuxt-link
    :data-testid="dataTestid"
    :to="to"
    class="border-transparent link font-medium group inline-flex items-center gap-1 hover:text-gray-600 dark:text-gray-400"
    :class="classes"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div
      :class="[
        'px-2 py-4',
        !vertical && isHovered ? 'bg-gray-100 dark:bg-gray-700' : '',
        showCount && count ? '' : 'pr-4',
      ]"
      class="md:my-1 sm:my-1 flex h-6 items-center space-x-2 rounded-lg"
    >
      <div class="text-black dark:text-blue-500">
        <slot />
      </div>
      <span class="text-xs text-gray-700 dark:text-white">{{ label }}</span>
      <span
        v-if="showCount && count !== null"
        class="rounded-lg bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-600 dark:text-white"
      >
        {{ count }}
      </span>
    </div>
  </nuxt-link>
</template>

<style>
.link.currentPage {
  @apply border-blue-500 text-black;
}
</style>

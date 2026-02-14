<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'nuxt/app';

const props = defineProps({
  count: {
    type: Number,
    default: 0,
  },
  to: {
    type: [String, Object],
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
  isActive: {
    type: Boolean,
    default: undefined,
  },
});

const route = useRoute(); // Access the current route

// Compute active state based on the current route
const isActive = computed(() => {
  // Use the isActive prop if explicitly provided, otherwise fall back to exact path matching
  if (props.isActive !== undefined) {
    return props.isActive;
  }
  return route.path === props.to;
});

const classes = computed(() => {
  const baseClasses = [];

  // Active state styling
  if (isActive.value) {
    if (props.vertical) {
      // Vertical active tab: background highlight
      baseClasses.push(
        'bg-gray-100 dark:bg-gray-700 pr-2 px-4 text-gray-700 dark:text-gray-100'
      );
    } else {
      // Horizontal active tab: orange bottom border
      baseClasses.push(
        'border-b-2 border-orange-500 text-gray-900 dark:text-gray-100'
      );
    }
  } else {
    // Inactive state styling
    baseClasses.push('text-gray-500 dark:text-gray-400');

    if (props.vertical) {
      // Vertical inactive tab: padding and hover effects
      baseClasses.push('pr-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-700');
    } else {
      // Horizontal inactive tab: transparent border
      baseClasses.push('border-transparent');
    }
  }

  return baseClasses.join(' ');
});

const isHovered = ref(false);
</script>

<template>
  <nuxt-link
    :data-testid="dataTestid"
    :to="to"
    class="border-transparent link group inline-flex items-center gap-1 pt-2 font-medium hover:text-gray-600 dark:text-gray-400"
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
      class="flex h-6 items-center space-x-2 rounded-lg sm:my-1 md:my-1"
    >
      <div class="text-black dark:text-gray-400">
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
  @apply text-black dark:text-white;
}
</style>

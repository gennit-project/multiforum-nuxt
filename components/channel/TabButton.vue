<script setup>
  import { computed, ref } from "vue";
  import { useRoute } from "nuxt/app";

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
      default: "",
    },
  });

  const route = useRoute(); // Access the current route

  // Compute active state based on the current route
  const isActive = computed(() => {
    return route.path === props.to;
  });

  const classes = computed(() => ({
    "border-orange-500 dark:border-gray-300 dark:text-gray-100": isActive.value,
    "bg-gray-100 dark:bg-gray-700 pr-2 px-4 text-gray-700": isActive.value && props.vertical,
    "border-b-2 dark:text-gray-400 dark:border-gray-300": isActive.value && !props.vertical,
    "text-gray-500 border-white dark:border-gray-300": !isActive.value,
    "pr-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-700": !isActive.value && props.vertical,
    "border-b-2 border-transparent": !isActive.value && !props.vertical,
  }));

  const isHovered = ref(false);
</script>

<template>
  <nuxt-link
    class="border-transparent link group inline-flex items-center gap-1 pt-2 font-medium hover:text-gray-600 dark:text-gray-400"
    :class="classes"
    :data-testid="dataTestid"
    :to="to"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div
      class="flex h-6 items-center space-x-2 rounded-lg sm:my-1 md:my-1"
      :class="[
        'px-2 py-4',
        !vertical && isHovered ? 'bg-gray-100 dark:bg-gray-700' : '',
        showCount && count ? '' : 'pr-4',
      ]"
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
    @apply border-gray-300 text-black dark:text-white;
  }
</style>

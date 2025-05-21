<script lang="ts">
  import { defineComponent } from "vue";

  export default defineComponent({
    props: {
      active: {
        type: Boolean,
        default: false,
      },
      text: {
        type: String,
        required: true,
      },
      loading: {
        type: Boolean,
        default: false,
      },
      testId: {
        type: String,
        default: "",
      },
    },
  });
</script>

<template>
  <button
    class="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    :class="{
      'bg-blue-500 text-white hover:bg-gray-800 dark:text-black hover:dark:bg-blue-600': active,
      'bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600':
        !active,
    }"
    :data-testid="testId"
    @keydown.enter.prevent
  >
    <LoadingSpinner v-if="loading" />
    <slot />
    {{ text }}
  </button>
</template>

<script setup lang="ts">
  const props = defineProps({
    loading: {
      type: Boolean,
      default: false,
    },
    reachedEndOfResults: {
      type: Boolean,
      required: true,
    },
  });

  const emit = defineEmits(["loadMore"]);
</script>

<template>
  <div>
    <p
      v-if="props.reachedEndOfResults"
      class="mb-12 mt-4 text-sm text-gray-500 dark:text-gray-200"
    >
      Reached the end of the results.
    </p>
    <p
      v-else-if="props.loading"
      class="mb-12 mt-4 text-sm text-gray-500 dark:text-gray-200"
    >
      Loading...
    </p>
    <button
      v-else
      class="cursor-pointer justify-self-center dark:text-gray-200"
      :class="!props.reachedEndOfResults ? 'underline' : ''"
      type="button"
      @click="emit('loadMore')"
    >
      Load more
    </button>
  </div>
</template>

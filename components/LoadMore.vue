<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    reachedEndOfResults: {
      type: Boolean,
      required: true,
    },
  },
});
</script>

<template>
  <div>
    <p
      v-if="reachedEndOfResults"
      class="mb-12 mt-4 text-sm text-gray-500 dark:text-gray-200"
    >
      Reached the end of the results.
    </p>
    <p
      v-else-if="loading"
      class="mb-12 mt-4 text-sm text-gray-500 dark:text-gray-200"
    >
      Loading...
    </p>
    <button
      v-else
      :class="!reachedEndOfResults ? 'underline' : ''"
      class="cursor-pointer justify-self-center"
      @click="$emit('loadMore')"
    >
      Load more
    </button>
  </div>
</template>

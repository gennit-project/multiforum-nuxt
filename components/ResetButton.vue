<script lang="ts">
import { defineComponent } from "vue";
import RefreshIcon from "@/components/icons/RefreshIcon.vue";

export default defineComponent({

  components: {
    RefreshIcon,
  },
  setup() {},
});
</script>
<template>
  <div class="h-14 p-2">
    <button
      class="bg-white dark:bg-gray-700 float-right inline-flex py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      @click.prevent="$emit('reset')"
    >
      <RefreshIcon
        class="h-5"
        @click="$emit('reset')"
      />Reset
    </button>
  </div>
</template>

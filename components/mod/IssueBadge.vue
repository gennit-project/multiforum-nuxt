<script lang="ts">
import { defineComponent } from "vue";
import type { Issue } from "@/__generated__/graphql";

export default defineComponent({
  props: {
    issue: {
      type: Object as () => Issue,
      required: true,
    },
  },
  setup(props) {
    return {
      isOpen: props.issue.isOpen,
    };
  },
});
</script>

<template>
  <div
    v-if="isOpen"
    class="flex flex-row items-center space-y-4 rounded-full bg-green-500 px-3 py-1 text-white"
  >
    <i class="far fa-dot-circle list-item-icon text-white" /> Open
  </div>
  <div
    v-else
    class="flex flex-row items-center gap-2 space-y-4 rounded-full bg-purple-500 py-1 pl-2 pr-3 text-white"
  >
    <i class="fa-regular fa-circle-check h-4 w-4 pl-1 mr-1" /> Closed
  </div>
</template>

<style scoped>
.text-wrap {
  overflow-wrap: break-word;
}
</style>

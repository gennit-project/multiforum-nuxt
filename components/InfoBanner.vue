<script lang="ts">
import { defineComponent } from "vue";
import InfoIcon from "@/components/icons/InfoIcon.vue";

export default defineComponent({
  components: {
    InfoIcon,
  },
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  setup() {},
});
</script>

<template>
  <div
    class="text-wrap text-sm flex text-blue-600 bg-blue-100 p-3 my-2 rounded pl-4 dark:bg-blue-800 dark:text-white gap-2"
  >
    <InfoIcon class="h-8 w-8 min-w-[32px] min-h-[32px]" /> {{ text }}
  </div>
</template>

<style scoped>
.text-wrap {
  overflow-wrap: break-word;
}
</style>

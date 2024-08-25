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
      required: true
    },
  },
  setup() {},
});
</script>

<template>
  <p class="text-wrap text-blue-500 bg-blue-100 p-2 my-2 rounded pl-4 dark:bg-blue-800 dark:text-white flex gap-2">
    <InfoIcon class="h-6 w-6" /> {{ text }}
  </p>
</template>

<style scoped>
.text-wrap {
  overflow-wrap: break-word;
}
</style>

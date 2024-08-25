<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    title: {
      type: String,
      required: true,
    },
    enableBack: {
      type: Boolean,
      default: true,
    },
  },
  setup() {
    return {};
  },
});
</script>

<template>
  <div class="flex w-full flex-col space-y-4">
    <span
      v-if="enableBack"
      class="cursor-pointer underline"
      @click="$emit('clickBack')"
      >Back</span
    >
    <h2 class="text-md font-bold">{{ title }}</h2>
    <slot></slot>
  </div>
</template>


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
  },
  setup() {},
});
</script>

<template>
  <button
    type="button"
    :class="[active ? 'ring-1 ring-blue-500 border-blue-500' : '']"
    class="
      flex inline-flex
      px-3.5
      py-2
      border
      text-xs
      font-medium
      rounded-full
      text-gray-700
       
      hover:bg-gray-50
      focus:ring-1 focus:ring-blue-500 focus:border-blue-500
    "
    @keydown.enter.prevent
  >
    <slot />
    <span class="whitespace-nowrap">{{ text }}</span>
  </button>
</template>
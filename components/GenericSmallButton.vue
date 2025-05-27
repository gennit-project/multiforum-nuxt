
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
<<<<<<< HEAD
    class="hover:bg-gray-50 flex inline-flex rounded-full border px-3.5 py-2 text-xs font-medium text-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
    :class="[active ? 'border-orange-500 ring-1 ring-orange-500' : '']"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
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
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
    class="hover:bg-gray-50 flex inline-flex rounded-full border px-3.5 py-2 text-xs font-medium text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    :class="[active ? 'border-blue-500 ring-1 ring-blue-500' : '']"
    type="button"
    @keydown.enter.prevent
  >
    <slot />
    <span class="whitespace-nowrap">{{ text }}</span>
  </button>
</template>

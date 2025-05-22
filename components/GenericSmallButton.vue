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
    class="hover:bg-gray-50 focus:border-orange-500 focus:ring-orange-500 flex inline-flex rounded-full border px-3.5 py-2 text-xs font-medium text-gray-700 focus:ring-1"
    :class="[active ? 'border-orange-500 ring-orange-500 ring-1' : '']"
    type="button"
    @keydown.enter.prevent
  >
    <slot />
    <span class="whitespace-nowrap">{{ text }}</span>
  </button>
</template>

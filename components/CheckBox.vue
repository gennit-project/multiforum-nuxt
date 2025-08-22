<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    checked: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update'],
  setup(props, { emit }) {
    const handleChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      emit('update', target.checked);
    };

    return {
      handleChange,
    };
  },
});
</script>

<template>
  <input
    type="checkbox"
    :class="[disabled ? 'text-orange-200' : 'text-orange-600']"
    class="h-4 w-4 rounded border border-gray-500 focus:ring-orange-500 dark:border-gray-400 dark:bg-gray-800 dark:focus:ring-orange-500"
    :checked="checked"
    :disabled="disabled"
    @change="handleChange"
  />
</template>

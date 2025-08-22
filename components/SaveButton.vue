<script lang="ts">
import { defineComponent } from 'vue';
import PrimaryButton from '@/components/PrimaryButton.vue';

export default defineComponent({
  components: {
    PrimaryButton,
  },
  emits: ['click'],
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    text: {
      type: String,
      default: 'Save',
    },
  },
  setup() {},
});
</script>
<template>
  <PrimaryButton
    :label="text"
    :disabled="disabled"
    :loading="loading"
    class="border-transparent ml-3 inline-flex justify-center rounded-full border px-4 py-2 text-sm font-medium shadow-sm dark:border-gray-700"
    @keydown.enter.prevent
    @click="$emit('click', $event)"
  />
</template>

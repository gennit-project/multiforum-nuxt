<script setup lang="ts">
import PrimaryButton from '@/components/PrimaryButton.vue';

withDefaults(
  defineProps<{
    disabled?: boolean;
    loading?: boolean;
    text?: string;
  }>(),
  {
    disabled: false,
    loading: false,
    text: 'Save',
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>
<template>
  <PrimaryButton
    :label="text"
    :disabled="disabled"
    :loading="loading"
    class="border-transparent ml-3 inline-flex justify-center rounded-full border px-4 py-2 text-sm font-medium shadow-sm dark:border-gray-700"
    @keydown.enter.prevent
    @click="emit('click', $event)"
  />
</template>

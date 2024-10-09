<script setup lang="ts">
import { ref, watchEffect, defineExpose } from 'vue';
import ExclamationTriangleIcon from '@/components/icons/ExclamationIcon.vue';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  value: {
    type: String,
    default: '',
  },
  invalid: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '',
  },
  rows: {
    type: Number,
    default: 1,
  },
  testId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update']);

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);
const text = ref(props.value);

const focus = () => {
  inputRef.value?.focus();
};

// Watch for changes in props.value to keep `text` in sync
watchEffect(() => {
  text.value = props.value;
});

defineExpose({ focus });

watchEffect(() => {
  emit('update', text.value);
});
</script>

<template>
  <div>
    <div class="relative mt-1 flex rounded-lg shadow-sm">
      <input
        v-if="rows === 1"
        ref="inputRef"
        v-model="text"
        :data-testid="testId"
        :placeholder="placeholder"
        :disabled="disabled"
        type="text"
        :class="[
          disabled ? ' bg-gray-200 bg-clip-padding dark:bg-gray-800' : '',
          invalid
            ? 'border-red-300 text-red-500 focus:border-red-500 focus:outline-none focus:ring-red-500'
            : 'focus:border-blue-500 focus:ring-blue-500',
        ]"
        class="block min-w-0 flex-1 rounded-lg border border-gray-200 pb-2.5 pt-2.5 placeholder-gray-400 dark:border-none dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 sm:text-sm"
        @update:model-value="$emit('update', text)"
      >
      <textarea
        v-else-if="rows > 1"
        ref="inputRef"
        v-model="text"
        :data-testid="testId"
        :placeholder="placeholder"
        :disabled="disabled"
        :rows="rows"
        type="text"
        :class="[
          disabled ? ' bg-gray-200 bg-clip-padding dark:bg-gray-800' : '',
          invalid
            ? 'border-red-300 text-red-500 focus:border-red-500 focus:outline-none focus:ring-red-500'
            : 'focus:border-blue-500 focus:ring-blue-500',
        ]"
        class="block min-w-0 flex-1 rounded-lg border-gray-200 pb-2.5 pt-2.5 placeholder-gray-400 dark:border-none dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-200 sm:text-sm"
        @update:model-value="$emit('update', text)"
      />
      <div
        v-if="invalid"
        class="pointer-posts-none absolute inset-y-0 right-0 flex items-center pr-3"
      >
        <ExclamationTriangleIcon
          class="h-5 w-5 text-red-500"
          aria-hidden="true"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>

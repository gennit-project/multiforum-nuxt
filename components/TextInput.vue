<script setup lang="ts">
import { ref, watch, defineExpose, computed } from 'vue';
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
  // Accessibility props
  label: {
    type: String,
    default: '',
  },
  ariaLabel: {
    type: String,
    default: '',
  },
  id: {
    type: String,
    default: '',
  },
  fullWidth: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update']);
const text = ref(props.value);

// Generate a unique ID if not provided
const inputId = computed(() => {
  if (props.id) return props.id;
  if (props.testId) return `input-${props.testId}`;
  return `input-${Math.random().toString(36).substr(2, 9)}`;
});

// Use ariaLabel if provided, otherwise fall back to label or placeholder
const accessibleLabel = computed(() => {
  return props.ariaLabel || props.label || props.placeholder || undefined;
});

watch(
  () => props.value,
  (newValue) => {
    text.value = newValue;
  }
);

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);
const focus = () => {
  inputRef.value?.focus();
};
defineExpose({ focus });

const handleInput = (value: string) => {
  text.value = value;
  emit('update', value);
};
</script>

<template>
  <div>
    <label
      v-if="label"
      :for="inputId"
      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
    </label>
    <div class="relative mt-1 flex rounded-lg">
      <input
        v-if="rows === 1"
        :id="inputId"
        ref="inputRef"
        v-model="text"
        class="block min-w-0 flex-1 rounded-lg border border-gray-300 pb-2.5 pt-2.5 placeholder-gray-400 dark:border-none dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 sm:text-sm"
        :class="[
          disabled
            ? 'bg-gray-200 bg-clip-padding dark:bg-gray-500 dark:text-gray-300'
            : '',
          invalid
            ? 'border-red-300 text-red-500 focus:border-red-500 focus:outline-none focus:ring-red-500'
            : 'focus:border-orange-500 focus:ring-orange-500',
        ]"
        :data-testid="testId"
        :disabled="disabled"
        :placeholder="placeholder"
        :aria-label="!label ? accessibleLabel : undefined"
        :aria-invalid="invalid || undefined"
        :aria-describedby="errorMessage ? `${inputId}-error` : undefined"
        type="text"
        @input="handleInput(($event.target as HTMLInputElement).value)"
      >
      <textarea
        v-else-if="rows && rows > 1"
        :id="inputId"
        ref="inputRef"
        v-model="text"
        :data-testid="testId"
        :placeholder="placeholder"
        :disabled="disabled"
        :rows="rows"
        :aria-label="!label ? accessibleLabel : undefined"
        :aria-invalid="invalid || undefined"
        :aria-describedby="errorMessage ? `${inputId}-error` : undefined"
        type="text"
        :class="[
          disabled ? 'bg-gray-200 bg-clip-padding dark:bg-gray-800' : '',
          invalid
            ? 'border-red-300 text-red-500 focus:border-red-500 focus:outline-none focus:ring-red-500'
            : 'focus:border-orange-500 focus:ring-orange-500',
        ]"
        class="block min-w-0 flex-1 rounded-lg border-gray-200 pb-2.5 pt-2.5 placeholder-gray-400 dark:border-none dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-200 sm:text-sm"
        @input="handleInput(($event.target as HTMLTextAreaElement).value)"
      />
      <div
        v-if="invalid"
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
      >
        <ExclamationTriangleIcon
          class="h-5 w-5 text-red-500"
          aria-hidden="true"
        />
      </div>
    </div>
    <p
      v-if="errorMessage"
      :id="`${inputId}-error`"
      class="mt-1 text-sm text-red-500"
      role="alert"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>

<style scoped></style>

<script setup lang="ts">
  import { ref, watch, defineExpose } from "vue";
  import ExclamationTriangleIcon from "@/components/icons/ExclamationIcon.vue";

  const props = defineProps({
    disabled: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: "",
    },
    value: {
      type: String,
      default: "",
    },
    invalid: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: "",
    },
    rows: {
      type: Number,
      default: 1,
    },
    testId: {
      type: String,
      default: "",
    },
  });
  const emit = defineEmits(["update"]);
  const text = ref(props.value);

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
    emit("update", value);
  };
</script>

<template>
  <div>
    <div class="relative mt-1 flex rounded-lg">
      <input
        v-if="rows === 1"
        ref="inputRef"
        v-model="text"
        class="block min-w-0 flex-1 rounded-lg border border-gray-500 pb-2.5 pt-2.5 placeholder-gray-400 dark:border-none dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 sm:text-sm"
        :class="[
          disabled ? 'bg-gray-200 bg-clip-padding dark:bg-gray-800' : '',
          invalid
            ? 'border-red-300 text-red-500 focus:border-red-500 focus:outline-none focus:ring-red-500'
            : 'focus:border-orange-500 focus:ring-orange-500',
        ]"
        :data-testid="testId"
        :disabled="disabled"
        :placeholder="placeholder"
        type="text"
        @input="handleInput(($event.target as HTMLInputElement).value)"
      />
      <textarea
        v-else-if="rows && rows > 1"
        ref="inputRef"
        v-model="text"
        class="block min-w-0 flex-1 rounded-lg border-gray-500 pb-2.5 pt-2.5 placeholder-gray-400 dark:border-none dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-200 sm:text-sm"
        :class="[
          disabled ? 'bg-gray-200 bg-clip-padding dark:bg-gray-800' : '',
          invalid
            ? 'border-red-300 text-red-500 focus:border-red-500 focus:outline-none focus:ring-red-500'
            : 'focus:border-orange-500 focus:ring-orange-500',
        ]"
        :data-testid="testId"
        :disabled="disabled"
        :placeholder="placeholder"
        :rows="rows"
        type="text"
        @input="handleInput(($event.target as HTMLTextAreaElement).value)"
      />
      <div
        v-if="invalid"
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
      >
        <ExclamationTriangleIcon
          aria-hidden="true"
          class="h-5 w-5 text-red-500"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>

<script setup lang="ts">
  import { computed, ref } from "vue";

  const props = defineProps({
    value: {
      type: String,
      required: true,
    },
    testId: {
      type: String,
      default: "date-picker",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(["update"]);
  const inputRef = ref<HTMLInputElement | null>(null);

  const handleChange = (event: Event) => {
    const inputElement = event.target as HTMLInputElement;
    emit("update", inputElement.value);
  };

  // Styles derived from the existing component
  const baseStyles = computed(() => {
    return [
      "border cursor-pointer rounded border-gray-300 text-sm focus:border-orange-500 focus:ring-orange-500 w-full sm:w-36 h-10",
      "dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:[color-scheme:dark]",
      props.disabled ? "opacity-60 cursor-not-allowed" : "",
    ].join(" ");
  });
</script>

<template>
  <div class="relative">
    <input
      ref="inputRef"
      :class="baseStyles"
      :data-testid="testId"
      :disabled="disabled"
      type="date"
      :value="value"
      style="color-scheme: light dark"
      @input="handleChange"
    >
    <!-- Using only the native calendar icon -->
  </div>
</template>

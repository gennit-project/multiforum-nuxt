<script setup lang="ts">
  import { computed } from "vue";
  import RadioButtons from "@/components/RadioButtons.vue";
  import { useUIStore, type FontSize } from "@/stores/uiStore";

  // Just use the store directly
  const uiStore = useUIStore();

  const options = [
    { label: "Small", value: "small" },
    { label: "Medium", value: "medium" },
    { label: "Large", value: "large" },
  ];

  const selectedOption = computed(() => {
    const size = uiStore.fontSize;
    return {
      label: size.charAt(0).toUpperCase() + size.slice(1),
      value: size,
    };
  });

  const updateFontSize = (option: { label: string; value: string }) => {
    // Call the store action directly
    uiStore.setFontSize(option.value as FontSize);
  };
</script>

<template>
  <div class="font-size-control">
    <div class="flex justify-between">
      <span class="my-2 text-sm font-bold leading-6 text-gray-500 dark:text-gray-400"
        >Font Size</span
      >
    </div>
    <RadioButtons
      :options="options"
      :selected-option="selectedOption"
      @update-selected="updateFontSize"
    />
  </div>
</template>

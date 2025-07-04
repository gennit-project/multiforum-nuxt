<script lang="ts" setup>
import { computed } from "vue";
const properties = defineProps({
  active: Boolean,
  count: {
    type: Number,
    default: 0,
  },
  loading: Boolean,
  showCount: Boolean,
  testId: {
    type: String,
    default: "",
  },
  tooltipText: {
    type: String,
    default: "",
  },
  tooltipUnicode: {
    type: String,
    default: "",
  },
  isPermalinked: Boolean,
  isMarkedAsAnswer: {
    type: Boolean,
    default: false,
  },
  class: {
    type: String,
    default: "",
  }
});

const emit = defineEmits(["vote"]);

const buttonClasses = computed(() => {
  const baseClasses = [
    "inline-flex max-h-6 cursor-pointer items-center rounded-full px-2 py-1",
  ];

  // Use green styling for best answer comments
  if (properties.isMarkedAsAnswer) {
    const bestAnswerClasses = properties.active
      ? "border-green-500 bg-green-500 dark:border-green-600 dark:bg-green-600 dark:hover:bg-green-500"
      : "border-green-200 bg-green-100 text-green-700 hover:border-green-400 hover:bg-green-200 dark:border-green-600 dark:bg-green-800 dark:text-green-300 dark:hover:bg-green-700";
    
    // Include external class passed from parent component
    const externalClass = properties.class || "";
    
    return [...baseClasses, bestAnswerClasses, externalClass].join(" ");
  }

  const defaultClasses = properties.active
    ? "border-orange-500 text-black bg-orange-500 dark:border-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500"
    : "border-gray-200 text-white bg-gray-100 text-black hover:border-orange-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600";

  const permalinkClasses = properties.isPermalinked
    ? "border-orange-500 hover:bg-orange-300 dark:border-orange-600 dark:hover:bg-orange-600"
    : "border-gray-200 dark:border-gray-600 hover:bg-gray-200";

  // Include external class passed from parent component
  const externalClass = properties.class || "";

  return [...baseClasses, defaultClasses, permalinkClasses, externalClass].join(" ");
});
</script>

<template>
  <div v-if="tooltipText">
    <client-only>
      <v-tooltip location="top" content-class="custom-tooltip">
        <template #activator="{ props }">
          <div v-bind="props">
            <AuthButton
              :test-id="testId"
              :button-classes="buttonClasses"
              :loading="loading"
              :show-count="showCount"
              :count="count"
              @click="emit('vote')"
            >
              <slot />
            </AuthButton>
          </div>
        </template>
        <template #default>
          <TooltipContent
            :tooltip-unicode="tooltipUnicode"
            :tooltip-text="tooltipText"
          />
        </template>
      </v-tooltip>
    </client-only>
  </div>
  <template v-else>
    <AuthButton
      :test-id="testId"
      :button-classes="buttonClasses"
      :loading="loading"
      :show-count="showCount"
      :count="count"
      @click="emit('vote')"
    >
      <slot />
    </AuthButton>
  </template>
</template>

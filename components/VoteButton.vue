<script lang="ts" setup>
<<<<<<< HEAD
  import { computed } from "vue";
  import FloatingTooltip from "@/components/FloatingTooltip.vue";
  import AuthButton from "@/components/AuthButton.vue";
  import TooltipContent from "@/components/TooltipContent.vue";
  
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
    class: {
      type: String,
      default: "",
    },
  });
=======
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
  class: {
    type: String,
    default: "",
  }
});
>>>>>>> parent of 666ae3d (Use automated formatting tools)

const emit = defineEmits(["vote"]);

const buttonClasses = computed(() => {
  const baseClasses = [
    "inline-flex max-h-6 cursor-pointer items-center rounded-full px-2 py-1",
  ];

<<<<<<< HEAD
    const defaultClasses = properties.active
      ? "border-orange-500 bg-orange-500 text-black dark:border-orange-200 dark:bg-orange-900 dark:hover:bg-orange-500"
      : "border-gray-300 bg-gray-100 text-black hover:border-orange-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-black dark:hover:bg-gray-600";

    const permalinkClasses = properties.isPermalinked
      ? "border-orange-500 hover:bg-orange-300 dark:border-orange-200 dark:hover:bg-orange-600"
      : "border-gray-300 dark:border-gray-600 hover:bg-gray-200";
=======
  const defaultClasses = properties.active
    ? "border-blue-500 bg-blue-500 text-white dark:border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
    : "border-gray-200 bg-gray-100 text-black hover:border-blue-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600";

  const permalinkClasses = properties.isPermalinked
    ? "border-blue-500 hover:bg-blue-300 dark:border-blue-600 dark:hover:bg-blue-600"
    : "border-gray-200 dark:border-gray-600 hover:bg-gray-200";
>>>>>>> parent of 666ae3d (Use automated formatting tools)

  // Include external class passed from parent component
  const externalClass = properties.class || "";

  return [...baseClasses, defaultClasses, permalinkClasses, externalClass].join(" ");
});
</script>

<template>
<<<<<<< HEAD
  <FloatingTooltip
    v-if="tooltipText"
    placement="top"
  >
=======
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
>>>>>>> parent of 666ae3d (Use automated formatting tools)
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
    <template #tooltip>
      <TooltipContent
        :tooltip-text="tooltipText"
        :tooltip-unicode="tooltipUnicode"
      />
    </template>
  </FloatingTooltip>
  <AuthButton
    v-else
    :button-classes="buttonClasses"
    :count="count"
    :loading="loading"
    :show-count="showCount"
    :test-id="testId"
    @click="emit('vote')"
  >
    <slot />
  </AuthButton>
</template>

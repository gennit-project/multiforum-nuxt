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
    class: {
      type: String,
      default: "",
    },
  });

  const emit = defineEmits(["vote"]);

  const buttonClasses = computed(() => {
    const baseClasses = ["inline-flex max-h-6 cursor-pointer items-center rounded-full px-2 py-1"];

    const defaultClasses = properties.active
      ? "border-orange-500 bg-orange-100 text-black dark:border-orange-200 dark:bg-orange-900 dark:hover:bg-orange-500"
      : "border-gray-300 bg-gray-100 text-black hover:border-orange-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-black dark:hover:bg-gray-600";

    const permalinkClasses = properties.isPermalinked
      ? "border-orange-500 hover:bg-orange-300 dark:border-orange-200 dark:hover:bg-orange-600"
      : "border-gray-300 dark:border-gray-600 hover:bg-gray-200";

    // Include external class passed from parent component
    const externalClass = properties.class || "";

    return [...baseClasses, defaultClasses, permalinkClasses, externalClass].join(" ");
  });
</script>

<template>
  <div v-if="tooltipText">
    <client-only>
      <v-tooltip
        content-class="custom-tooltip"
        location="top"
      >
        <template #activator="{ props }">
          <div v-bind="props">
            <AuthButton
              :button-classes="buttonClasses"
              :count="count"
              :loading="loading"
              :show-count="showCount"
              :test-id="testId"
              @click="emit('vote')"
            >
              <slot />
            </AuthButton>
          </div>
        </template>
        <template #default>
          <TooltipContent
            :tooltip-text="tooltipText"
            :tooltip-unicode="tooltipUnicode"
          />
        </template>
      </v-tooltip>
    </client-only>
  </div>
  <template v-else>
    <AuthButton
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
</template>

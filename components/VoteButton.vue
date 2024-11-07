<script lang="ts" setup>

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
});

const emit = defineEmits(["vote"]);

const buttonClasses = computed(() => [
  "inline-flex max-h-6 cursor-pointer items-center rounded-full px-2 py-1 hover:dark:border-blue-500 hover:dark:text-blue-500",
  properties.active
    ? "border-blue-500 bg-blue-100 text-black dark:text-white dark:border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-600"
    : "border-gray-100 bg-gray-100 text-black hover:border-gray-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-700",
]);
</script>

<template>
  <v-tooltip v-if="tooltipText" location="top" content-class="custom-tooltip">
    <template #activator="{ props }">
      <AuthButton
        :props="props"
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
    <template #default>
      <TooltipContent
        :tooltip-unicode="tooltipUnicode"
        :tooltip-text="tooltipText"
      />
    </template>
  </v-tooltip>

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
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

console.log('vote button logged in user upvoted ', properties.active);
const emit = defineEmits(["vote"]);

const buttonClasses = computed(() => {
  const baseClasses = [
    "inline-flex max-h-6 cursor-pointer items-center rounded-full px-2 py-1",
  ];

  const defaultClasses = properties.active
    ? "border-blue-500 bg-blue-300 text-black dark:text-white dark:border-blue-600 dark:bg-blue-600 dark:hover:bg-blue-600"
    : "border-gray-100 bg-gray-100 text-black hover:border-gray-400 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-700";

  const permalinkClasses = properties.isPermalinked
    ? "border border-blue-500 hover:bg-blue-300"
    : "border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700";

  return [...baseClasses, defaultClasses, permalinkClasses];
});

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

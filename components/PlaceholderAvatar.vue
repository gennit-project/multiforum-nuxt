<script setup lang="ts">
import { User } from "lucide-vue-next";

defineProps({
  size: {
    type: String,
    default: "md",
  },
});

const sizeClasses: Record<string, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};
</script>

<template>
  <div
    :class="[
      'flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700',
      sizeClasses[size],
    ]"
  >
    <User
      class="text-gray-500 dark:text-gray-400"
      :size="size === 'sm' ? 16 : size === 'md' ? 20 : 24"
    />
  </div>
</template>

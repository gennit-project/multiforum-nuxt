<script setup lang="ts">
import CheckIcon from "@/components/icons/CheckIcon.vue";
import XmarkIcon from "@/components/icons/XmarkIcon.vue";

interface Props {
  permissions: Record<string, any>;
}

defineProps<Props>();

const formatPermissionName = (name: string) => {
  if (!name || typeof name !== "string") return "";
  return name
    .split(/(?=[A-Z])/)
    .map((word) => word.toLowerCase())
    .join(" ");
};
</script>

<template>
  <div class="mt-2 space-y-1">
    <div
      v-for="(value, key) in permissions"
      :key="key"
      :class="[
        ['__typename', 'name', 'description'].includes(key) ? 'hidden' : '',
      ]"
      class="flex items-center"
    >
      <CheckIcon
        v-if="value"
        class="w-4 h-4 text-green-500"
        aria-label="Permission granted"
      />
      <XmarkIcon
        v-else
        class="w-4 h-4 text-red-500"
        aria-label="Permission denied"
      />
      <span class="ml-2 text-sm">{{ formatPermissionName(key) }}</span>
    </div>
  </div>
</template>

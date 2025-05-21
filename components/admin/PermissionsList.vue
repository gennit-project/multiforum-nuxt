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
      class="flex items-center"
      :class="[['__typename', 'name', 'description'].includes(key) ? 'hidden' : '']"
    >
      <CheckIcon
        v-if="value"
        aria-label="Permission granted"
        class="h-4 w-4 text-green-500"
      />
      <XmarkIcon
        v-else
        aria-label="Permission denied"
        class="h-4 w-4 text-red-500"
      />
      <span class="ml-2 text-sm">{{ formatPermissionName(key) }}</span>
    </div>
  </div>
</template>

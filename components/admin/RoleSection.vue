<script lang="ts" setup>
import PermissionsList from "@/components/admin/PermissionsList.vue";
defineProps({
  roleTitle: {
    type: String,
    default: ''
  },
  roleDescription: {
    type: String,
    default: ''
  },
  permissions: {
    type: Object,
    required: true
  },
  sectionTitle: {
    type: String,
    default: ''
  },
});
</script>
<template>
  <div class="mb-6">
    <h2 v-if="sectionTitle" class="text-lg font-semibold border-b pb-2">
      {{ sectionTitle }}
    </h2>
    <hr class="mb-4" >
    <div class="bg-gray-50 dark:bg-gray-800 py-2 rounded-lg">
      <h3 class="font-medium">
        {{ roleTitle }}
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-3">
        {{ roleDescription }}
      </p>
      <PermissionsList :permissions="permissions" />
    </div>
  </div>
</template>

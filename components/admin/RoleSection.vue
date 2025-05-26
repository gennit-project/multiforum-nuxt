<script lang="ts" setup>
  import PermissionsList from "@/components/admin/PermissionsList.vue";
  defineProps({
    roleTitle: {
      type: String,
      default: "",
    },
    roleDescription: {
      type: String,
      default: "",
    },
    permissions: {
      type: Object,
      required: true,
    },
    sectionTitle: {
      type: String,
      default: "",
    },
  });
</script>
<template>
  <div class="mb-6">
    <h2
      v-if="sectionTitle"
      class="font-semibold border-b pb-2 text-lg"
    >
      {{ sectionTitle }}
    </h2>
    <hr class="mb-4" >
    <div class="bg-gray-50 rounded-lg py-2 dark:bg-gray-800">
      <h3 class="font-medium">
        {{ roleTitle }}
      </h3>
      <p class="mb-3 mt-1 text-sm text-gray-600 dark:text-gray-300">
        {{ roleDescription }}
      </p>
      <PermissionsList :permissions="permissions" />
    </div>
  </div>
</template>

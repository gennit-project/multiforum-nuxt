<script lang="ts" setup>
import ServerIssueTabNav from '@/components/mod/ServerIssueTabNav.vue';
</script>

<template>
  <div
    class="border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900 dark:text-white"
  >
    <ServerIssueTabNav
      open-route-name="admin-issues"
      closed-route-name="admin-issues-closed"
      create-route-name="admin-issues-create"
    />
    <NuxtPage />
  </div>
</template>

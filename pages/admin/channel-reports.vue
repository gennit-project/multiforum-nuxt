<script lang="ts" setup>
import ChannelReportsList from '@/components/admin/ChannelReportsList.vue';
</script>

<template>
  <div class="flex-col space-y-4 dark:text-white">
    <div class="mb-6">
      <h1 class="mb-2 text-xl font-bold">Channel Reports</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        These are reports submitted against entire forums. Channel reports are
        server-scoped and reviewed by server admins.
      </p>
      <ul
        class="ml-4 mt-2 list-outside list-disc text-sm text-gray-600 dark:text-gray-400"
      >
        <li>Click "View" to see the full issue and activity feed</li>
        <li>Click "Lock" to prevent new content in a forum</li>
        <li>Click "Unlock" to re-enable content creation in a locked forum</li>
      </ul>
    </div>
    <FormRow>
      <template #content>
        <ChannelReportsList />
      </template>
    </FormRow>
  </div>
</template>

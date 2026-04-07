<script lang="ts" setup>
import ServerSuspendedUserList from '@/components/admin/ServerSuspendedUserList.vue';
</script>

<template>
  <div class="flex-col space-y-4 dark:text-white">
    <div class="mb-6">
      <h1 class="mb-2 text-xl font-bold">Server-Suspended Users</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        These are the active server-scoped suspensions for user accounts.
      </p>
      <ul
        class="ml-4 list-outside list-disc text-sm text-gray-600 dark:text-gray-400"
      >
        <li>
          To un-suspend a user, open the related issue and follow the provided
          instructions.
        </li>
        <li>
          To suspend a user, use the relevant server-scoped moderation workflow
          so the issue trail stays attached to the action.
        </li>
      </ul>
    </div>
    <FormRow>
      <template #content>
        <ServerSuspendedUserList />
      </template>
    </FormRow>
  </div>
</template>

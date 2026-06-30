<script lang="ts" setup>
import ServerSuspendedModList from '@/components/admin/ServerSuspendedModList.vue';
</script>

<template>
  <div class="flex-col space-y-4 dark:text-white">
    <div class="mb-6">
      <h1 class="mb-2 text-xl font-bold">Server-Suspended Mods</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        These are the active server-scoped moderator suspensions.
      </p>
      <ul
        class="ml-4 list-outside list-disc text-sm text-gray-600 dark:text-gray-400"
      >
        <li>
          To un-suspend a moderator, open the related issue and follow the
          provided instructions.
        </li>
        <li>
          To suspend a moderator, use a server-scoped moderation action so the
          related issue, reported content, and suspension stay linked.
        </li>
      </ul>
    </div>
    <FormRow>
      <template #content>
        <ServerSuspendedModList />
      </template>
    </FormRow>
  </div>
</template>

<script setup lang="ts">
import PendingInvite from '@/components/mod/PendingInvite.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
</script>
<template>
  <ClientOnly>
    <RequireAuth>
      <template #has-auth>
        <PendingInvite />
      </template>
      <template #does-not-have-auth>
        <div class="flex flex-col items-center justify-center dark:text-white">
          <h1 class="text-2xl">Accept Invite</h1>
          <p class="text-lg">You must be logged in to accept an invite.</p>
        </div>
      </template>
    </RequireAuth>
    <template #fallback>
      <div class="flex flex-col items-center justify-center py-8">
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
        />
      </div>
    </template>
  </ClientOnly>
</template>

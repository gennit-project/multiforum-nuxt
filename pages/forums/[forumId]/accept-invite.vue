<script setup lang="ts">
  import PendingInvite from "@/components/mod/PendingInvite.vue";
  import RequireAuth from "@/components/auth/RequireAuth.vue";
</script>
<template>
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
</template>

<script setup lang="ts">
import NotificationTabs from '@/components/notifications/NotificationTabs.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
</script>

<template>
  <NuxtLayout>
    <RequireAuth>
      <template #has-auth>
        <NotificationTabs />
      </template>
      <template #does-not-have-auth>
        <p>You must be logged in to view your notifications.</p>
      </template>
    </RequireAuth>
  </NuxtLayout>
</template>

<script setup lang="ts">
  import NotificationList from "@/components/user/NotificationList.vue";
  import RequireAuth from "@/components/auth/RequireAuth.vue";
</script>

<template>
  <NuxtLayout>
    <RequireAuth>
      <template #has-auth>
        <NotificationList />
      </template>
      <template #does-not-have-auth>
        <p>You must be logged in to view your notifications.</p>
      </template>
    </RequireAuth>
  </NuxtLayout>
</template>

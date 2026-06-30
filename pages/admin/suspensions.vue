<script setup lang="ts">
import AdminSuspensionsFields from '@/components/admin/AdminSuspensionsFields.vue';
</script>

<template>
  <ClientOnly>
    <div class="px-8">
      <AdminSuspensionsFields />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import PluginDetailPage from '@/pages/admin/settings/plugins/[pluginId].vue';

// @ts-ignore - definePageMeta is auto-imported by Nuxt
definePageMeta({
  layout: 'default',
});
</script>

<template>
  <PluginDetailPage />
</template>

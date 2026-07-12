<script setup lang="ts">
import MapView from '@/components/event/map/MapView.vue';
import { useHead } from 'nuxt/app';

useHead({ title: 'Map' });
</script>
<template>
  <NuxtLayout>
    <MapView />
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { useHead } from 'nuxt/app';
import EventListView from '@/components/event/list/EventListView.vue';

useHead({
  title: 'Online Events',
});
</script>

<template>
  <NuxtLayout>
    <div class="px-3 md:px-12">
      <EventListView />
    </div>
  </NuxtLayout>
</template>

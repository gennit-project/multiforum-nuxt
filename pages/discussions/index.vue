<script setup lang="ts">
import SearchDiscussions from '@/components/discussion/list/SearchDiscussions.vue';
import { useHead } from 'nuxt/app';

useHead({ title: 'Discussions' });
</script>

<template>
  <NuxtLayout>
    <SearchDiscussions :is-forum-scoped="false" />
  </NuxtLayout>
</template>

<style scoped></style>

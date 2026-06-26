<script setup lang="ts">
import { config } from '@/config';
import { computed } from 'vue';
import { useRoute, useHead } from 'nuxt/app';
import SearchDiscussions from '@/components/discussion/list/SearchDiscussions.vue';

const route = useRoute();

const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const pageTitle = computed(() => {
  const serverName = config.serverDisplayName;
  return `Discussions | ${channelId.value} | ${serverName}`;
});

useHead({
  title: pageTitle,
});
</script>

<template>
  <SearchDiscussions :is-forum-scoped="true" />
</template>

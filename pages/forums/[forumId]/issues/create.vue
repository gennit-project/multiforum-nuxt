<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import CreateIssueForm from '@/components/mod/CreateIssueForm.vue';

const route = useRoute();
const channelId = computed(() =>
  typeof route.params.forumId === 'string' ? route.params.forumId : ''
);
</script>

<template>
  <div class="md:px-6">
    <CreateIssueForm :default-channel-id="channelId" />
  </div>
</template>

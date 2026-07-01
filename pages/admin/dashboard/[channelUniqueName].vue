<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ChannelHealthDetailView from '@/components/dashboard/ChannelHealthDetailView.vue';

const route = useRoute();

const channelUniqueName = computed(() => {
  const value = route.params.channelUniqueName;
  return typeof value === 'string' ? value : '';
});
</script>

<template>
  <ChannelHealthDetailView
    :channel-unique-name="channelUniqueName"
    audience-label="Admin dashboard"
    back-href="/admin/dashboard"
    back-label="Back to server dashboard"
  />
</template>

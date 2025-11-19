<script setup lang="ts">
import SitewideDownloadList from '@/components/discussion/list/SitewideDownloadList.vue';
import DiscussionFilterBar from '@/components/discussion/list/DiscussionFilterBar.vue';
</script>

<template>
  <NuxtLayout>
    <SitewideDownloadList>
      <DiscussionFilterBar />
    </SitewideDownloadList>
  </NuxtLayout>
</template>

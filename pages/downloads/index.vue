<script setup lang="ts">
import SitewideDownloadList from '@/components/discussion/list/SitewideDownloadList.vue';
import DiscussionFilterBar from '@/components/discussion/list/DiscussionFilterBar.vue';
import { useHead } from 'nuxt/app';

useHead({ title: 'Downloads' });
</script>

<template>
  <NuxtLayout>
    <SitewideDownloadList>
      <DiscussionFilterBar />
    </SitewideDownloadList>
  </NuxtLayout>
</template>

<script setup lang="ts">
import IssueList from '@/components/mod/IssueList.vue';
</script>

<template>
  <NuxtLayout>
    <IssueList :is-forum-scoped="true" />
  </NuxtLayout>
</template>
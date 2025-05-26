<script setup lang="ts">
  import SearchDiscussions from "@/components/discussion/list/SearchDiscussions.vue";
  
  // Explicitly set layout
  definePageMeta({
    layout: 'default'
  });
</script>

<template>
  <NuxtLayout name="default">
    <SearchDiscussions :is-forum-scoped="false" />
  </NuxtLayout>
</template>

<style scoped></style>

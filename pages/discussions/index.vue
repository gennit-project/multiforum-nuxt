<script setup lang="ts">
  import SearchDiscussions from "@/components/discussion/list/SearchDiscussions.vue";
</script>

<template>
  <div class="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-200">
    <SearchDiscussions :is-forum-scoped="false" />
  </div>
</template>

<style scoped></style>

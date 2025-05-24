<script setup lang="ts">
  import DownloadList from "@/components/channel/DownloadList.vue";
  import DiscussionFilterBar from "@/components/discussion/list/DiscussionFilterBar.vue";
</script>

<template>
  <div>
    <DiscussionFilterBar :is-forum-scoped="true" />
    <DownloadList />
  </div>
</template>

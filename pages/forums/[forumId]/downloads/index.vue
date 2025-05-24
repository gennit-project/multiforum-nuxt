<script setup lang="ts">
  import { useRoute } from "nuxt/app";
  import { computed } from "vue";
  import DownloadList from "@/components/channel/DownloadList.vue";
  import DiscussionFilterBar from "@/components/discussion/list/DiscussionFilterBar.vue";

  const route = useRoute();

  const channelId = computed(() => {
    return typeof route.params.forumId === "string" ? route.params.forumId : "";
  });
</script>

<template>
  <div>
    <DiscussionFilterBar :is-forum-scoped="true" />
    <DownloadList />
  </div>
</template>

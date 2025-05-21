<script setup lang="ts">
  import { GET_CHANNEL_WIKI } from "@/graphQLData/channel/queries";
  import { useQuery } from "@vue/apollo-composable";
  import { useRoute } from "nuxt/app";

  const route = useRoute();

  const channelId = computed(() => {
    return typeof route.params.forumId === "string" ? route.params.forumId : "";
  });
  const { result: getChannelResult, onResult: onGetChannelResult } = useQuery(
    GET_CHANNEL_WIKI,
    {
      uniqueName: channelId,
    },
    {
      fetchPolicy: "cache-first",
      nextFetchPolicy: "cache-first",
    }
  );
</script>

<template>
  <div class="dark:text-white">
    <h1>Wiki</h1>
  </div>
</template>

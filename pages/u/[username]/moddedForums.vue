<script setup lang="ts">
import { computed } from "vue";
import { GET_MODDED_CHANNELS } from "@/graphQLData/user/queries";
import { useQuery } from "@vue/apollo-composable";
import ChannelList from "@/components/channel/ChannelList.vue";
import { useRoute } from "nuxt/app";

const route = useRoute();

const username = computed(() => {
  if (typeof route.params.username === "string") {
    return route.params.username;
  }
  return "";
});

const { result, loading, error } = useQuery(
  GET_MODDED_CHANNELS,
  () => ({
    username: username.value,
  }),
  {
    fetchPolicy: "cache-first",
  }
);
</script>
<template>
  <div class="flex flex-col gap-3 py-3 dark:text-white">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error</div>
    <div
      v-else-if="
        result?.users?.length === 0 ||
        result.users[0]?.ModOfChannels?.length === 0
      "
    >
      This user is not a mod in any forums.
    </div>
    <ChannelList
      v-else
      :channels="result.users[0].ModOfChannels"
      :result-count="result.users[0].ModOfChannelsAggregate.count"
    />
  </div>
</template>

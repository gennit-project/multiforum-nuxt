<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "nuxt/app";
import { useQuery } from "@vue/apollo-composable";
import DownloadList from "@/components/channel/DownloadList.vue";
import DownloadFilterBar from "@/components/download/DownloadFilterBar.vue";
import DownloadFilters from "@/components/download/DownloadFilters.vue";
import { GET_CHANNEL } from "@/graphQLData/channel/queries";
import type { FilterGroup } from "@/__generated__/graphql";

const route = useRoute();

const channelId = computed(() => {
  return typeof route.params.forumId === "string" ? route.params.forumId : "";
});

const { result: channelResult, loading: channelLoading } = useQuery(GET_CHANNEL, {
  uniqueName: channelId,
});

const channel = computed(() => channelResult.value?.channels[0]);

const filterGroups = computed<FilterGroup[]>(() => {
  return channel.value?.FilterGroups || [];
});
</script>

<template>
  <div>
    <DownloadFilterBar :filter-groups="filterGroups" />
    
    <!-- Desktop Layout with Sidebar -->
    <div class="hidden lg:flex">
      <!-- Left Sidebar for Filters -->
      <div 
        v-if="filterGroups.length > 0"
        class="w-64 flex-shrink-0 pr-6"
      >
        <div class="sticky top-4">
          <DownloadFilters 
            :filter-groups="filterGroups" 
            :is-sidebar="true"
          />
        </div>
      </div>
      
      <!-- Main Content Area -->
      <div class="flex-1 min-w-0">
        <DownloadList :filter-groups="filterGroups" />
      </div>
    </div>
    
    <!-- Mobile Layout (no sidebar) -->
    <div class="lg:hidden">
      <DownloadList :filter-groups="filterGroups" />
    </div>
  </div>
</template>

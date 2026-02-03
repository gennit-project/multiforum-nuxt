<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import type { Issue } from '@/__generated__/graphql';
import { useUIStore } from '@/stores/uiStore';
import { GET_ISSUES_BY_CHANNEL } from '@/graphQLData/issue/queries';
import { useQuery } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'nuxt/app';
import { updateFilters } from '@/utils/routerUtils';
import { createCaseInsensitivePattern } from '@/utils/searchUtils';
import SearchBar from '@/components/SearchBar.vue';
import ModIssueListItem from './ModIssueListItem.vue';
import { storeToRefs } from 'pinia';

export default defineComponent({
  components: {
    ModIssueListItem,
    SearchBar,
  },
  setup() {
    const uiStore = useUIStore();
    const { selectedIssueNumber } = storeToRefs(uiStore);
    const route = useRoute();
    const router = useRouter();

    const channelId = computed(() => {
      if (typeof route.params.forumId !== 'string') {
        return '';
      }
      return route.params.forumId;
    });

    const searchInput = ref(
      typeof route.query.searchInput === 'string' ? route.query.searchInput : ''
    );

    const queryVariables = computed(() => ({
      channelUniqueName: channelId.value,
      searchInput: createCaseInsensitivePattern(searchInput.value) || '.*',
    }));

    const {
      result: getIssuesByChannelResult,
      error: getIssuesByChannelError,
      loading: getIssuesByChannelLoading,
      refetch: refetchIssuesByChannel,
    } = useQuery(GET_ISSUES_BY_CHANNEL, queryVariables);

    const issues = computed<Issue[]>(() => {
      if (getIssuesByChannelLoading.value || getIssuesByChannelError.value) {
        return [];
      }
      const channelData = getIssuesByChannelResult.value?.channels?.[0];

      if (!channelData || !channelData.Issues) {
        return [];
      }
      return channelData.Issues;
    });

    const updateSearchInput = (value: string) => {
      updateFilters({
        router,
        route,
        params: { searchInput: value },
      });
    };

    const handleSelectIssue = (payload: {
      issueNumber: number;
      title: string;
      channelId: string;
    }) => {
      uiStore.setSelectedIssueSelection(payload);
    };

    watch(
      () => route.query,
      () => {
        searchInput.value =
          typeof route.query.searchInput === 'string'
            ? route.query.searchInput
            : '';
        refetchIssuesByChannel(queryVariables.value);
      }
    );

    watch(
      channelId,
      (newChannelId, oldChannelId) => {
        if (newChannelId !== oldChannelId) {
          uiStore.clearSelectedIssueSelection();
        }
      }
    );

    return {
      channelId,
      issues,
      getIssuesByChannelLoading,
      searchInput,
      updateSearchInput,
      handleSelectIssue,
      selectedIssueNumber,
    };
  },
});
</script>

<template>
  <div class="border-t border-gray-200 dark:border-gray-800 dark:text-white">
    <div class="px-4 py-4">
      <SearchBar
        :initial-value="searchInput"
        :search-placeholder="'Search issues'"
        :test-id="'issue-search-input'"
        :debounce-ms="500"
        @update-search-input="updateSearchInput"
      />
    </div>
    <div
      v-if="!getIssuesByChannelLoading && issues.length === 0"
      class="px-4 py-6 text-sm text-gray-600 dark:text-gray-300"
    >
      There are no issues yet.
      <nuxt-link
        :to="{
          name: 'forums-forumId-issues-create',
          params: { forumId: channelId },
        }"
        class="text-blue-600 underline hover:underline dark:text-blue-400"
      >
        Create one?
      </nuxt-link>
    </div>
    <ul class="divide-y" data-testid="issue-list">
      <ModIssueListItem
        v-for="issue in issues"
        :key="issue.id"
        :issue="issue"
        :channel-id="channelId"
        :is-selectable="true"
        :selected-issue-number="selectedIssueNumber ?? undefined"
        @select="handleSelectIssue"
      />
    </ul>
  </div>
</template>

<style scoped>
.text-wrap {
  overflow-wrap: break-word;
}
</style>

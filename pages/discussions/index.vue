<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { GET_SITE_WIDE_DISCUSSION_LIST } from '@/graphQLData/discussion/queries';
import SitewideDiscussionListItem from '@/components/discussion/list/SitewideDiscussionListItem.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import { getFilterValuesFromParams } from '@/components/event/list/filters/getFilterValuesFromParams';
import { getSortFromQuery, getTimeFrameFromQuery } from '@/components/comments/getSortFromQuery';
import type { SearchDiscussionValues } from '@/types/Discussion';
import { useApolloClient } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';

const DISCUSSION_PAGE_LIMIT = 15;

const route = useRoute();
const router = useRouter();

const channelId = computed(() => {
  return typeof route.params.channelId === 'string' ? route.params.channelId : '';
});

const filterValues = ref<SearchDiscussionValues>(
  getFilterValuesFromParams({ route, channelId: channelId.value })
);

const selectedChannelsComputed = computed(() => filterValues.value.channels);
const selectedTagsComputed = computed(() => filterValues.value.tags);
const searchInputComputed = computed(() => filterValues.value.searchInput || '');

const activeSort = computed(() => getSortFromQuery(route.query));
const activeTimeFrame = computed(() => getTimeFrameFromQuery(route.query));

const { data, error } = await useAsyncData('sitewideDiscussions', async () => {
  const client = useApolloClient().client;
  const { data } = await client.query({
    query: GET_SITE_WIDE_DISCUSSION_LIST,
    variables: {
      searchInput: searchInputComputed.value,
      selectedChannels: selectedChannelsComputed.value,
      selectedTags: selectedTagsComputed.value,
      options: {
        limit: DISCUSSION_PAGE_LIMIT,
        offset: 0,
        sort: activeSort.value,
        timeFrame: activeTimeFrame.value,
      },
    },
  });

  return data.getSiteWideDiscussionList;
});

const discussions = computed(() => {
  return data?.value?.discussions || [];
});

const aggregateDiscussionCount = computed(() => {
  return data?.value?.aggregateDiscussionCount || 0;
});

const reachedEndOfResults = ref(false);

const loadMore = async () => {
  const currentOffset = discussions.value.length;

  const { data: moreData } = await client.query({
    query: GET_SITE_WIDE_DISCUSSION_LIST,
    variables: {
      searchInput: searchInputComputed.value,
      selectedChannels: selectedChannelsComputed.value,
      selectedTags: selectedTagsComputed.value,
      options: {
        limit: DISCUSSION_PAGE_LIMIT,
        offset: currentOffset,
        sort: activeSort.value,
        timeFrame: activeTimeFrame.value,
      },
    },
  });

  discussions.value.push(...moreData.getSiteWideDiscussionList.discussions);
};

const filterByTag = (tag: string) => {
  router.replace({
    query: {
      ...route.query,
      tags: tag,
    },
  });
};

const filterByChannel = (channel: string) => {
  router.replace({
    query: {
      ...route.query,
      channels: channel,
    },
  });
};

const updateFilters = (params: SearchDiscussionValues) => {
  const existingQuery = route.query;
  router.replace({
    query: {
      ...existingQuery,
      ...params,
    },
  });
};

watch(route.query, () => {
  filterValues.value = getFilterValuesFromParams({
    route,
    channelId: channelId.value,
  });
});
</script>

<template>
  <div class="w-full md:rounded-lg md:px-2">
    <slot />
    <p v-if="!data && !error">
      Loading...
    </p>
    <ErrorBanner v-else-if="error" class="max-w-5xl" :text="error.message" />
    <p v-else-if="discussions.length === 0" class="my-6 flex gap-2 px-4">
      <span>There are no discussions to show.</span>
      <RequireAuth :full-width="false">
        <template #has-auth>
          <NuxtLink :to="{ name: 'CreateDiscussion' }" class="text-blue-500 underline">
            Create one?
          </NuxtLink>
        </template>
        <template #does-not-have-auth>
          <span class="cursor-pointer text-blue-500 underline">Create one?</span>
        </template>
      </RequireAuth>
    </p>
    <div v-if="discussions.length > 0">
      <ul role="list" class="my-6 flex flex-col gap-1" data-testid="sitewide-discussion-list">
        <SitewideDiscussionListItem
          v-for="discussion in discussions"
          :key="discussion.id"
          :discussion="discussion"
          :score="discussion.score"
          :search-input="filterValues.searchInput"
          :selected-tags="filterValues.tags"
          :selected-channels="filterValues.channels"
          @filter-by-tag="filterByTag"
          @filter-by-channel="filterByChannel"
        />
      </ul>
      <div v-if="discussions.length > 0">
        <LoadMore
          class="ml-4 justify-self-center"
          :loading="!data && !error"
          :reached-end-of-results="aggregateDiscussionCount === discussions.length"
          @load-more="loadMore"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'nuxt/app';
import {
  SERVER_SCOPED_ISSUE_COUNT,
  SERVER_SCOPED_CLOSED_ISSUE_COUNT,
} from '@/graphQLData/mod/queries';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import IssueDetail from '@/components/mod/IssueDetail.vue';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';

const route = useRoute();
const router = useRouter();
const uiStore = useUIStore();
const { selectedIssueNumber, selectedIssueTitle, selectedIssueChannelId } =
  storeToRefs(uiStore);
const {
  result: issuesResult,
  error: issuesError,
  loading: issuesLoading,
} = useQuery(SERVER_SCOPED_ISSUE_COUNT);

const {
  result: closedIssuesResult,
  error: closedIssuesError,
  loading: closedIssuesLoading,
} = useQuery(SERVER_SCOPED_CLOSED_ISSUE_COUNT);

const openCount = computed(() => {
  if (issuesLoading.value || issuesError.value) {
    return 0;
  }
  return issuesResult.value?.issuesAggregate?.count || 0;
});

const closedCount = computed(() => {
  if (closedIssuesLoading.value || closedIssuesError.value) {
    return 0;
  }
  return closedIssuesResult.value?.issuesAggregate?.count || 0;
});
</script>

<template>
  <div
    class="border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900 dark:text-white"
  >
    <nav
      class="flex items-center justify-between gap-4 py-3 pl-4 pr-4 shadow-sm"
    >
      <div class="flex items-center gap-4">
        <nuxt-link
          :to="{
            name: 'admin-issues',
          }"
          class="border-b-2 px-4 py-2"
          :class="{
            'border-black text-black dark:border-white dark:text-white':
              route.name === 'admin-issues',
            'border-gray-500 text-gray-500 dark:text-gray-400':
              route.name !== 'admin-issues',
          }"
        >
          <i class="far fa-dot-circle" /> {{ openCount }} Open
        </nuxt-link>
        <nuxt-link
          :to="{
            name: 'admin-issues-closed',
          }"
          class="border-b-2 px-4 py-2"
          :class="{
            'border-black text-black dark:border-white dark:text-white':
              route.name === 'admin-issues-closed',
            'border-gray-500 text-gray-500 dark:text-gray-400':
              route.name !== 'admin-issues-closed',
          }"
        >
          <i class="fa-regular fa-circle-check" /> {{ closedCount }} Closed
        </nuxt-link>
      </div>
      <RequireAuth :full-width="false">
        <template #has-auth>
          <PrimaryButton
            :label="'New Issue'"
            @click="
              router.push({
                name: 'admin-issues-create',
              })
            "
          />
        </template>
        <template #does-not-have-auth>
          <PrimaryButton :label="'New Issue'" />
        </template>
      </RequireAuth>
    </nav>
    <NuxtPage />
  </div>
</template>

<script lang="ts" setup>
// Open/Closed count tabs plus the "New Issue" button for the server-wide issue
// lists. Shared by the admin issue pages (/admin/issues) and the public
// transparency pages (/server/issues); the caller passes the route names to
// link to so the same shell works under either route tree. The New Issue button
// follows the GitHub model — any logged-in account can open an issue, so it is
// gated only behind authentication (RequireAuth), not moderator status.
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'nuxt/app';
import {
  SERVER_SCOPED_ISSUE_COUNT,
  SERVER_SCOPED_CLOSED_ISSUE_COUNT,
} from '@/graphQLData/mod/queries';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import { buildServerIssueWhere } from '@/utils/serverIssueFilters';
import { getServerIssueFilterValuesFromParams } from '@/utils/getServerIssueFilterValuesFromParams';

const props = defineProps<{
  openRouteName: string;
  closedRouteName: string;
  createRouteName: string;
}>();

const route = useRoute();
const router = useRouter();

const filterValues = computed(() =>
  getServerIssueFilterValuesFromParams({ route })
);

const openCountVariables = computed(() => ({
  issueWhere: buildServerIssueWhere({
    ...filterValues.value,
    isOpen: true,
  }),
}));

const closedCountVariables = computed(() => ({
  issueWhere: buildServerIssueWhere({
    ...filterValues.value,
    isOpen: false,
  }),
}));

const {
  result: issuesResult,
  error: issuesError,
  loading: issuesLoading,
} = useQuery(SERVER_SCOPED_ISSUE_COUNT, openCountVariables);

const {
  result: closedIssuesResult,
  error: closedIssuesError,
  loading: closedIssuesLoading,
} = useQuery(SERVER_SCOPED_CLOSED_ISSUE_COUNT, closedCountVariables);

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
  <nav
    class="flex flex-wrap items-center justify-between gap-4 py-3 pl-4 pr-4 shadow-sm"
  >
    <div class="flex flex-wrap items-center gap-4">
      <nuxt-link
        :to="{ name: openRouteName }"
        class="border-b-2 px-4 py-2 whitespace-nowrap"
        :class="{
          'border-black text-black dark:border-white dark:text-white':
            route.name === openRouteName,
          'border-gray-500 text-gray-500 dark:text-gray-400':
            route.name !== openRouteName,
        }"
      >
        <i class="far fa-dot-circle" /> {{ openCount }} Open
      </nuxt-link>
      <nuxt-link
        :to="{ name: closedRouteName }"
        class="border-b-2 px-4 py-2 whitespace-nowrap"
        :class="{
          'border-black text-black dark:border-white dark:text-white':
            route.name === closedRouteName,
          'border-gray-500 text-gray-500 dark:text-gray-400':
            route.name !== closedRouteName,
        }"
      >
        <i class="fa-regular fa-circle-check" /> {{ closedCount }} Closed
      </nuxt-link>
    </div>
    <RequireAuth :full-width="false">
      <template #has-auth>
        <PrimaryButton
          :label="'New Issue'"
          @click="router.push({ name: props.createRouteName })"
        />
      </template>
      <template #does-not-have-auth>
        <PrimaryButton :label="'New Issue'" />
      </template>
    </RequireAuth>
  </nav>
</template>

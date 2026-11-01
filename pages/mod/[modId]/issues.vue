<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import IssueListItem from '@/components/mod/ModIssueListItem.vue';
import { GetModDocument as GET_MOD, GetModIssuesDocument as GET_MOD_ISSUES } from '@/__generated__/operations';

const PAGE_LIMIT = 25;
const route = useRoute();
const modProfileName = computed(() => {
  return typeof route.params.modId === 'string' ? route.params.modId : '';
});

const { result: modResult, error: getModError } = useQuery(GET_MOD, () => ({
  displayName: modProfileName.value,
}));

const mod = computed(() => {
  if (modResult.value && modResult.value.moderationProfiles.length > 0) {
    return modResult.value.moderationProfiles[0];
  }
  return null;
});

const commentsAggregate = computed(() => {
  return mod.value ? mod.value.AuthoredIssuesConnection?.aggregate?.count?.nodes : 0;
});

const {
  result: issueResult,
  loading,
  error,
  fetchMore,
} = useQuery(
  GET_MOD_ISSUES,
  () => ({
    displayName: modProfileName.value,
    limit: PAGE_LIMIT,
    offset: 0,
  }),
  {
    fetchPolicy: 'cache-first',
  }
);

const loadMore = () => {
  if (!issueResult.value?.moderationProfiles?.[0]?.AuthoredIssues) return;

  const requestedProfile = modProfileName.value;
  fetchMore({
    variables: {
      displayName: requestedProfile,
      limit: PAGE_LIMIT,
      offset: issueResult.value.moderationProfiles[0].AuthoredIssues.length,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult || requestedProfile !== modProfileName.value) return previousResult;
      const prevModProfile = previousResult.moderationProfiles[0];
      const nextModProfile = fetchMoreResult.moderationProfiles[0];
      if (!prevModProfile || !nextModProfile) return previousResult;
      const prevAuthoredIssues = prevModProfile.AuthoredIssues || [];
      const newComments =
        nextModProfile.AuthoredIssues || [];
      return {
        ...previousResult,
        moderationProfiles: [
          {
            ...prevModProfile,
            AuthoredIssues: [...new Map([...prevAuthoredIssues, ...newComments].map(item => [item.id, item])).values()],
          },
        ],
      };
    },
  });
};

const issueCount = computed(() => {
  return (
    issueResult.value?.moderationProfiles?.[0]?.AuthoredIssues?.length || 0
  );
});

const issues = computed(() => {
  const result =
    issueResult.value?.moderationProfiles?.[0]?.AuthoredIssues || [];
  if ((result.length === 0 && loading.value) || error.value) {
    return [];
  }
  return result;
});
</script>

<template>
  <div class="py-3 dark:text-white">
    <ErrorBanner v-if="error" :text="error.message" />
    <ErrorBanner v-if="getModError" :text="getModError.message" />
    <div
      v-else-if="
        issueResult?.moderationProfiles?.length === 0 || issueCount === 0
      "
    >
      This mod has not opened any issues
    </div>

    <ul
      v-else-if="issueResult && issueResult?.moderationProfiles?.length > 0"
      class="divide-y border-t border-gray-200 dark:border-gray-800 dark:text-white"
      data-testid="issue-list"
    >
      <IssueListItem v-for="issue in issues" :key="issue.id" :issue="issue" />
    </ul>
    <div v-if="issueCount">
      <LoadMore
        class="justify-self-center"
        :reached-end-of-results="commentsAggregate === issueCount"
        @load-more="loadMore"
      />
    </div>
  </div>
</template>

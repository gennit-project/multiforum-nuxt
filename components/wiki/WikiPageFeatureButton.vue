<script setup lang="ts">
import { computed } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { config } from '@/config';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { SET_FEATURED_WIKI_PAGES } from '@/graphQLData/admin/mutations';
import { useIsAuthenticated, useUsername } from '@/composables/useAuthState';
import { useServerRoleMembership } from '@/composables/useServerRoleMembership';
import { useToast } from '@/composables/useToast';

const props = defineProps<{
  wikiPageId: string;
}>();

const isAuthenticated = useIsAuthenticated();
const username = useUsername();
const toast = useToast();
const { serverAdminUsernames } = useServerRoleMembership();

const { result: serverConfigResult } = useQuery(
  GET_SERVER_CONFIG,
  { serverName: config.serverName },
  { fetchPolicy: 'cache-first' }
);

const featuredIds = computed<string[]>(
  () => serverConfigResult.value?.serverConfigs?.[0]?.featuredWikiPageIds ?? []
);
const isFeatured = computed(() => featuredIds.value.includes(props.wikiPageId));

// The backend enforces canManageServerSettings; this only decides visibility.
const isServerAdmin = computed(
  () =>
    isAuthenticated.value &&
    !!username.value &&
    serverAdminUsernames.value.includes(username.value)
);

const {
  mutate: setFeaturedWikiPages,
  loading: saving,
  onDone,
  onError,
} = useMutation(SET_FEATURED_WIKI_PAGES, {
  refetchQueries: ['getSiteWideWikiList'],
});

onDone((result) => {
  const savedIds: string[] =
    result.data?.setFeaturedWikiPages?.featuredWikiPageIds ?? [];
  toast.success(
    savedIds.includes(props.wikiPageId)
      ? 'Wiki page featured on the site wiki list.'
      : 'Wiki page removed from featured pages.'
  );
});

onError((error) => {
  toast.error(`Could not update featured wiki pages: ${error.message}`);
});

const toggleFeatured = () => {
  const wikiPageIds = isFeatured.value
    ? featuredIds.value.filter((id) => id !== props.wikiPageId)
    : [...featuredIds.value, props.wikiPageId];

  setFeaturedWikiPages({ serverName: config.serverName, wikiPageIds });
};
</script>

<template>
  <button
    v-if="isServerAdmin"
    type="button"
    data-testid="wiki-page-feature-button"
    class="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
    :disabled="saving"
    @click="toggleFeatured"
  >
    <i :class="['fa-solid fa-star', isFeatured ? '' : 'opacity-60']" />
    <span>{{
      isFeatured ? 'Remove from featured' : 'Feature on site wiki'
    }}</span>
  </button>
</template>

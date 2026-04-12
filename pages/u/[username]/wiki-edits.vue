<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useRoute } from 'nuxt/app';
import { GET_USER_WIKI_EDITS } from '@/graphQLData/user/queries';
import { useSelectedChannelsFromQuery } from '@/composables/useSelectedChannelsFromQuery';
import { timeAgo } from '@/utils';
import type { TextVersion, WikiPage } from '@/__generated__/graphql';

type WikiEditPage = Pick<
  WikiPage,
  'id' | 'title' | 'slug' | 'channelUniqueName'
> & {
  PastVersions?: TextVersion[] | null;
};

type WikiEdit = TextVersion & {
  wikiPage: Pick<WikiPage, 'id' | 'title' | 'slug' | 'channelUniqueName'>;
};

const route = useRoute();
const { selectedChannels, hasSelectedChannels } = useSelectedChannelsFromQuery();

const username = computed(() => {
  return typeof route.params.username === 'string' ? route.params.username : '';
});

const versionWhere = computed(() => ({
  Author: {
    username: username.value,
  },
}));

const wikiPagesWhere = computed(() => {
  const baseWhere = {
    PastVersions_SOME: versionWhere.value,
  };

  if (!hasSelectedChannels.value) {
    return baseWhere;
  }

  return {
    AND: [
      baseWhere,
      {
        channelUniqueName_IN: selectedChannels.value,
      },
    ],
  };
});

const { result, loading, error } = useQuery(
  GET_USER_WIKI_EDITS,
  () => ({
    where: wikiPagesWhere.value,
    versionWhere: versionWhere.value,
  }),
  {
    fetchPolicy: 'cache-first',
  }
);

const wikiEdits = computed<WikiEdit[]>(() => {
  const pages = (result.value?.wikiPages || []) as WikiEditPage[];

  return pages
    .flatMap((wikiPage) => {
      const page = {
        id: wikiPage.id,
        title: wikiPage.title,
        slug: wikiPage.slug,
        channelUniqueName: wikiPage.channelUniqueName,
      };

      return (wikiPage.PastVersions || []).map((version) => ({
        ...version,
        wikiPage: page,
      }));
    })
    .sort((a, b) => {
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
});

const getWikiPagePath = (edit: WikiEdit) => {
  return `/forums/${edit.wikiPage.channelUniqueName}/wiki/${edit.wikiPage.slug}`;
};

const getWikiRevisionPath = (edit: WikiEdit) => {
  return `/forums/${edit.wikiPage.channelUniqueName}/wiki/revisions/diff/${edit.wikiPage.slug}/${edit.id}`;
};
</script>

<template>
  <div class="flex flex-col gap-3 py-3 dark:text-white">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error</div>
    <div v-else-if="wikiEdits.length === 0">No wiki edits yet</div>
    <ul v-else class="flex flex-col gap-3">
      <li
        v-for="edit in wikiEdits"
        :key="edit.id"
        class="rounded-md border border-gray-200 p-3 dark:border-gray-700"
      >
        <div class="flex flex-col gap-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <NuxtLink
              :to="getWikiPagePath(edit)"
              class="font-medium text-orange-600 hover:underline dark:text-orange-400"
            >
              {{ edit.wikiPage.title }}
            </NuxtLink>
            <span class="text-gray-500 dark:text-gray-400">
              in {{ edit.wikiPage.channelUniqueName }}
            </span>
            <span class="text-gray-500 dark:text-gray-400">
              {{ timeAgo(new Date(edit.createdAt)) }}
            </span>
          </div>
          <div
            v-if="edit.editReason"
            class="text-sm text-gray-700 dark:text-gray-300"
          >
            {{ edit.editReason }}
          </div>
          <NuxtLink
            :to="getWikiRevisionPath(edit)"
            class="text-sm text-orange-600 hover:underline dark:text-orange-400"
          >
            View revision
          </NuxtLink>
        </div>
      </li>
    </ul>
  </div>
</template>

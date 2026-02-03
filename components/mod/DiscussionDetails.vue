<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_DISCUSSION } from '@/graphQLData/discussion/queries';
import { DateTime } from 'luxon';
import { useRoute } from 'nuxt/app';
import { modProfileNameVar } from '@/cache';
import { stableRelativeTime } from '@/utils';
import type { Issue } from '@/__generated__/graphql';

/* component imports that were previously declared in `components:`.
   Adjust the paths if yours are different. */
import ErrorBanner from '@/components/ErrorBanner.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import MarkdownPreview from '../MarkdownPreview.vue';
import AvatarComponent from '@/components/AvatarComponent.vue';
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import { getOriginalPoster } from '@/utils/originalPoster';

const props = defineProps<{
  activeIssue: Issue;
  channelId?: string;
}>();

const emit = defineEmits(['fetchedOriginalAuthorUsername']);

/* ---------- route & variable helpers ---------- */
const route = useRoute();

const discussionId = computed(() => props.activeIssue.relatedDiscussionId);

const channelId = computed(() => {
  if (props.channelId) return props.channelId;
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

/* ---------- GraphQL query ---------- */
const {
  result: getDiscussionResult,
  error: getDiscussionError,
  loading: getDiscussionLoading,
  onResult: onGetDiscussionResult,
} = useQuery(GET_DISCUSSION, () => ({
  id: discussionId.value,
  loggedInModName: modProfileNameVar.value,
  channelUniqueName: channelId.value,
}));

const discussion = computed(() => {
  if (getDiscussionLoading.value || getDiscussionError.value) return null;
  return getDiscussionResult.value?.discussions?.[0] ?? null;
});

const downloadableFiles = computed(
  () => discussion.value?.DownloadableFiles || []
);

onGetDiscussionResult(({ data }) => {
  if (data?.discussions?.length) {
    const author = getOriginalPoster({ Discussion: data.discussions[0] });
    if (author.username) {
      emit('fetchedOriginalAuthorUsername', author.username);
    }
  }
});

/* ---------- utilities ---------- */
const formatDate = (iso: string) =>
  DateTime.fromISO(iso).toLocaleString(DateTime.DATE_FULL);

const editedAt = computed(() => {
  if (!discussion.value?.updatedAt) return '';
  return `Edited ${stableRelativeTime(discussion.value.updatedAt)}`;
});

const metaLine = computed(() => {
  if (!discussion.value) return '';
  const posted = `posted on ${formatDate(discussion.value.createdAt)}`;
  if (!discussion.value.updatedAt) return posted;
  return `${posted} · ${editedAt.value}`;
});

const formatFileSize = (sizeInBytes: number | null | undefined): string => {
  if (!sizeInBytes || sizeInBytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const decimals = unitIndex === 0 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(decimals)} ${units[unitIndex]}`;
};
</script>

<template>
  <div>
    <ErrorBanner v-if="getDiscussionError" :text="getDiscussionError.message" />
    <LoadingSpinner v-else-if="getDiscussionLoading" />
    <div
      v-else-if="!discussion"
      class="bg-gray-50 rounded-lg border border-gray-300 p-4 text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
    >
      <p>Can't find the content that was reported. It may have been deleted.</p>
    </div>
    <ClientOnly v-else>
      <div v-if="discussion" class="mt-3 flex w-full flex-col gap-2">
        <nuxt-link
          :to="{
            name: 'u-username',
            params: { username: discussion?.Author?.username },
          }"
          class="flex flex-wrap items-center gap-1 dark:text-white"
        >
          <span class="flex items-center">
            <AvatarComponent
              :text="discussion?.Author.username"
              :src="discussion?.Author.profilePicURL ?? ''"
              class="mr-2 h-6 w-6"
            />
          </span>
          <span class="inline-flex flex-wrap items-center gap-1">
            <UsernameWithTooltip
              v-if="discussion?.Author?.username"
              :username="discussion?.Author?.username"
              :src="discussion?.Author.profilePicURL ?? ''"
              :display-name="discussion?.Author.displayName ?? ''"
              :comment-karma="discussion?.Author.commentKarma ?? 0"
              :discussion-karma="discussion?.Author.discussionKarma ?? 0"
              :account-created="discussion?.Author.createdAt ?? ''"
            />
            <ClientOnly tag="span">
              <span class="text-sm text-gray-600 dark:text-gray-300">
                {{ metaLine }}
              </span>
              <template #fallback>
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  posted on {{ discussion.createdAt.split('T')[0] }}
                </span>
              </template>
            </ClientOnly>
          </span>
        </nuxt-link>

        <div class="border-l border-l-2 pl-6">
          <h3 v-if="discussion?.title">
            <nuxt-link
              :to="{
                name: 'forums-forumId-discussions-discussionId',
                params: { forumId: channelId, discussionId: discussion.id },
              }"
              class="text-orange-500 dark:text-orange-400"
              rel="noopener noreferrer"
            >
              {{ discussion.title }}
            </nuxt-link>
          </h3>

          <MarkdownPreview
            v-if="discussion?.body"
            class="max-w-none"
            :text="discussion.body"
            :disable-gallery="true"
            :word-limit="1000"
          />

          <div
            v-if="downloadableFiles.length"
            class="bg-orange-50 mt-4 space-y-3 rounded-md border border-orange-300 p-4 dark:border-orange-500/60 dark:bg-orange-900/30"
            data-testid="issue-downloads"
          >
            <div
              class="font-semibold text-sm text-orange-800 dark:text-orange-200"
            >
              Attached download{{ downloadableFiles.length > 1 ? 's' : '' }}
            </div>
            <div class="space-y-2">
              <div
                v-for="file in downloadableFiles"
                :key="file.id"
                class="rounded border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div
                      class="truncate font-medium text-gray-900 dark:text-gray-100"
                    >
                      {{ file.fileName || 'Untitled file' }}
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-300">
                      {{ file.kind || 'File' }} •
                      {{ formatFileSize(file.size) }}
                    </div>
                    <div class="text-xs text-gray-600 dark:text-gray-300">
                      License: {{ file.license?.name || 'Not specified' }}
                    </div>
                  </div>
                  <a
                    v-if="file.url"
                    class="font-semibold shrink-0 rounded bg-orange-500 px-3 py-2 text-xs text-white shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-orange-600 dark:hover:bg-orange-500"
                    :href="file.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </div>
                <div
                  v-if="!file.url"
                  class="mt-2 text-xs text-red-600 dark:text-red-400"
                >
                  Download URL unavailable
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #fallback>
        <div class="mt-3 flex w-full flex-col gap-2">
          <div class="flex items-center dark:text-white">
            <div class="mr-2 h-6 w-6 animate-pulse rounded-full bg-gray-300" />
            <div class="h-4 w-32 animate-pulse rounded bg-gray-300" />
          </div>
          <div class="border-l border-l-2 pl-6">
            <div class="mb-2 h-6 w-48 animate-pulse rounded bg-gray-300" />
            <div class="h-4 w-full animate-pulse rounded bg-gray-300" />
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

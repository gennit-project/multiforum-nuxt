<script setup lang="ts">
import { computed } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { relativeTime } from '@/utils';
import {
  UPDATE_SCRATCHPAD_ENTRY_VISIBILITY,
  DELETE_SCRATCHPAD_ENTRY,
} from '@/graphQLData/scratchpad/mutations';
import {
  getPermalinkToDiscussion,
  getPermalinkToDiscussionComment,
} from '@/utils/routerUtils';
import ErrorBanner from '@/components/ErrorBanner.vue';

interface ScratchpadEntryData {
  id: string;
  createdAt: string;
  text: string;
  isPublic: boolean;
  sourceType: string;
  // DiscussionChannel id (discussion) or Comment id (comment).
  sourceId: string;
  sourceChannelUniqueName?: string;
  // The Discussion id the upvoted content belongs to. Needed to build a working
  // link, since the discussion route expects the Discussion id, not sourceId.
  discussionId?: string;
  Author: {
    username: string;
    displayName?: string;
    profilePicURL?: string;
  };
}

const props = defineProps({
  entry: {
    type: Object as () => ScratchpadEntryData,
    required: true,
  },
  isOwner: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['updated', 'deleted']);

const authorDisplayName = computed(() => {
  return props.entry.Author?.displayName || props.entry.Author?.username || 'Unknown';
});

const sourceLink = computed(() => {
  const { sourceType, sourceId, sourceChannelUniqueName, discussionId } =
    props.entry;

  // Without the channel we cannot build any forum link.
  if (!sourceChannelUniqueName) return '#';

  // Without the discussion id (e.g. older entries created before it was
  // recorded) fall back to the forum's discussion list rather than a wrong link.
  if (!discussionId) {
    return `/forums/${sourceChannelUniqueName}/discussions`;
  }

  if (sourceType === 'comment') {
    // sourceId is the Comment id; link straight to the comment permalink.
    return getPermalinkToDiscussionComment({
      forumId: sourceChannelUniqueName,
      discussionId,
      commentId: sourceId,
    });
  }

  // discussion: sourceId is the DiscussionChannel id; link to the discussion.
  return getPermalinkToDiscussion({
    forumId: sourceChannelUniqueName,
    discussionId,
  });
});

const sourceTypeLabel = computed(() => {
  return props.entry.sourceType === 'comment' ? 'comment' : 'post';
});

const {
  mutate: updateVisibility,
  loading: updateLoading,
  error: updateError,
  onDone: onUpdateDone,
} = useMutation(UPDATE_SCRATCHPAD_ENTRY_VISIBILITY);

const {
  mutate: deleteEntry,
  loading: deleteLoading,
  error: deleteError,
  onDone: onDeleteDone,
} = useMutation(DELETE_SCRATCHPAD_ENTRY);

onUpdateDone(() => {
  emit('updated');
});

onDeleteDone(() => {
  emit('deleted');
});

const handleMakePublic = () => {
  updateVisibility({
    scratchpadEntryId: props.entry.id,
    isPublic: true,
  });
};

const handleMakePrivate = () => {
  updateVisibility({
    scratchpadEntryId: props.entry.id,
    isPublic: false,
  });
};

const handleDelete = () => {
  if (confirm('Are you sure you want to delete this entry? This cannot be undone.')) {
    deleteEntry({
      scratchpadEntryId: props.entry.id,
    });
  }
};

const isLoading = computed(() => updateLoading.value || deleteLoading.value);
</script>

<template>
  <div
    data-testid="scratchpad-entry"
    class="rounded-lg border p-4"
    :class="{
      'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800': entry.isPublic,
      'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20': !entry.isPublic,
    }"
  >
    <ErrorBanner v-if="updateError" :text="updateError.message" class="mb-3" />
    <ErrorBanner v-if="deleteError" :text="deleteError.message" class="mb-3" />

    <!-- Pending badge for private entries -->
    <div v-if="!entry.isPublic && isOwner" class="mb-2">
      <span
        class="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
      >
        <i class="fa-solid fa-clock mr-1" />
        Pending
      </span>
    </div>

    <!-- Header with author info -->
    <div class="flex items-start gap-3">
      <NuxtLink :to="`/u/${entry.Author?.username}`" class="flex-shrink-0">
        <AvatarComponent
          :src="entry.Author?.profilePicURL"
          :text="entry.Author?.username || 'U'"
          :is-square="false"
          class="h-10 w-10"
        />
      </NuxtLink>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 text-sm">
          <NuxtLink
            :to="`/u/${entry.Author?.username}`"
            class="font-medium text-gray-900 hover:underline dark:text-white"
          >
            {{ authorDisplayName }}
          </NuxtLink>
          <span class="text-gray-500 dark:text-gray-400">
            super upvoted your
            <NuxtLink
              :to="sourceLink"
              data-testid="scratchpad-source-link"
              class="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {{ sourceTypeLabel }}
            </NuxtLink>
          </span>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ relativeTime(entry.createdAt) }}
        </p>
      </div>
    </div>

    <!-- Message content -->
    <div class="mt-3 text-gray-700 dark:text-gray-300">
      <p class="whitespace-pre-wrap">{{ entry.text }}</p>
    </div>

    <!-- Action buttons for owner (pending entries) -->
    <div v-if="isOwner" class="mt-4 flex flex-wrap items-center gap-2">
      <template v-if="!entry.isPublic">
        <button
          :disabled="isLoading"
          class="inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          @click="handleMakePublic"
        >
          <i v-if="updateLoading" class="fa-solid fa-spinner fa-spin" />
          <i v-else class="fa-solid fa-check" />
          Make Public
        </button>
        <button
          :disabled="isLoading"
          class="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          @click="handleDelete"
        >
          <i v-if="deleteLoading" class="fa-solid fa-spinner fa-spin" />
          <i v-else class="fa-solid fa-times" />
          Ignore
        </button>
      </template>
      <template v-else>
        <button
          :disabled="isLoading"
          class="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          @click="handleMakePrivate"
        >
          <i class="fa-solid fa-eye-slash" />
          Hide
        </button>
        <button
          :disabled="isLoading"
          class="inline-flex items-center gap-1 rounded-full border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:bg-gray-700 dark:text-red-400 dark:hover:bg-red-900/30"
          @click="handleDelete"
        >
          <i v-if="deleteLoading" class="fa-solid fa-spinner fa-spin" />
          <i v-else class="fa-solid fa-trash" />
          Delete
        </button>
      </template>
    </div>
  </div>
</template>

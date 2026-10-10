<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'nuxt/app';
import type {
  Discussion,
  Issue,
  ModerationAction,
} from '@/__generated__/graphql';
import ActivityFeedListItem from './ActivityFeedListItem.vue';
import { ActionType } from '@/types/Comment';

const props = defineProps<{
  feedItems: ModerationAction[];
  originalUserAuthorUsername: string;
  originalModAuthorName: string;
  relatedDiscussion?: Discussion | null;
  issue?: Issue | null;
  suspendModDisabled?: boolean;
}>();

const route = useRoute();
const hasIssueNumberInRoute = computed(
  () => typeof route.params.issueNumber === 'string'
);

type FeedFilter = 'all' | 'comments' | 'moderation';
const activeFilter = ref<FeedFilter>('all');

const feedFilters: Array<{ value: FeedFilter; label: string }> = [
  { value: 'all', label: 'All activity' },
  { value: 'comments', label: 'Comments' },
  { value: 'moderation', label: 'Moderation' },
];

const reversedFeedItems = computed(() => {
  return props.feedItems.slice().reverse();
});

const normalizeActionType = (actionType?: string | null) => {
  return (actionType || '').toLowerCase().trim();
};

const isEditAction = (actionType?: string | null) => {
  const normalized = normalizeActionType(actionType);
  return normalized === ActionType.Edit || normalized === 'edit_content';
};

const normalizeActionDescription = (description?: string | null) => {
  return (description || '').toLowerCase().trim();
};

const isDiscussionTitleEdit = (item: ModerationAction) => {
  return (
    isEditAction(item.actionType) &&
    normalizeActionDescription(item.actionDescription).includes(
      'discussion title'
    )
  );
};

const isDiscussionBodyEdit = (item: ModerationAction) => {
  return (
    isEditAction(item.actionType) &&
    normalizeActionDescription(item.actionDescription).includes(
      'discussion body'
    )
  );
};

const getActorKey = (item: ModerationAction) => {
  if (item.ModerationProfile?.displayName) {
    return `mod:${item.ModerationProfile.displayName}`;
  }
  if (item.User?.username) {
    return `user:${item.User.username}`;
  }
  return '';
};

const wasTriggeredTogether = (
  first: ModerationAction,
  second: ModerationAction
) => {
  const firstTime = new Date(first.createdAt).getTime();
  const secondTime = new Date(second.createdAt).getTime();
  if (!Number.isFinite(firstTime) || !Number.isFinite(secondTime)) {
    return false;
  }
  return Math.abs(firstTime - secondTime) <= 5000;
};

// For each revision activity item, find what the content was changed TO
// by looking at the next revision's "old" body (which is this revision's "new" body)
const getNextRevisionBody = (currentIndex: number): string | null => {
  const items = reversedFeedItems.value;
  // Look for the next item (later in time) that has a Revision
  for (let i = currentIndex + 1; i < items.length; i++) {
    const item = items[i] as ModerationAction & {
      Revision?: { body?: string };
    };
    if (item.Revision?.body) {
      return item.Revision.body;
    }
  }
  // No next revision found - this is the most recent edit, use current discussion body
  return null;
};

const getNextBodyRevisionForIndex = (currentIndex: number): string | null => {
  const items = reversedFeedItems.value;
  for (let i = currentIndex + 1; i < items.length; i++) {
    const item = items[i] as ModerationAction & {
      Revision?: { body?: string };
    };
    if (!isDiscussionBodyEdit(item)) {
      continue;
    }
    if (item.Revision?.body) {
      return item.Revision.body;
    }
  }
  return null;
};

// For comment edits, calculate the edit index (0 = most recent, 1 = second most recent, etc.)
// This is used to get the correct old/new versions from the comment's PastVersions
const getCommentEditIndex = (currentIndex: number): number | null => {
  const items = reversedFeedItems.value;
  const currentItem = items[currentIndex] as ModerationAction & {
    Comment?: { PastVersions?: Array<{ id: string }> };
  };

  // Only applies to Edit actions with a Comment that has PastVersions
  if (
    !isEditAction(currentItem.actionType) ||
    !currentItem.Comment?.PastVersions?.length
  ) {
    return null;
  }

  // Count how many comment edit actions come AFTER this one (are more recent)
  // in the reversed list (which is chronological order)
  let editIndex = 0;
  for (let i = currentIndex + 1; i < items.length; i++) {
    const item = items[i] as ModerationAction & {
      Comment?: { id: string };
    };
    // Count edits on the same comment
    if (
      isEditAction(item.actionType) &&
      item.Comment?.id === currentItem.Comment?.id
    ) {
      editIndex++;
    }
  }
  return editIndex;
};

const displayFeedItems = computed(() => {
  const items = reversedFeedItems.value;
  const result: Array<{
    activityItem: ModerationAction;
    pairedActivityItem: ModerationAction | null;
    nextRevisionBody: string | null;
    pairedNextRevisionBody: string | null;
    commentEditIndex: number | null;
  }> = [];

  for (let i = 0; i < items.length; i++) {
    const current = items[i];
    if (!current) {
      continue;
    }
    const next = items[i + 1];
    const canPair =
      !!next &&
      getActorKey(current) &&
      getActorKey(current) === getActorKey(next) &&
      wasTriggeredTogether(current, next) &&
      ((isDiscussionTitleEdit(current) && isDiscussionBodyEdit(next)) ||
        (isDiscussionBodyEdit(current) && isDiscussionTitleEdit(next)));

    if (canPair) {
      result.push({
        activityItem: current,
        pairedActivityItem: next,
        nextRevisionBody: isDiscussionBodyEdit(current)
          ? getNextBodyRevisionForIndex(i)
          : getNextRevisionBody(i),
        pairedNextRevisionBody: isDiscussionBodyEdit(next)
          ? getNextBodyRevisionForIndex(i + 1)
          : getNextRevisionBody(i + 1),
        commentEditIndex: getCommentEditIndex(i),
      });
      i++;
      continue;
    }

    result.push({
      activityItem: current,
      pairedActivityItem: null,
      nextRevisionBody: isDiscussionBodyEdit(current)
        ? getNextBodyRevisionForIndex(i)
        : getNextRevisionBody(i),
      pairedNextRevisionBody: null,
      commentEditIndex: getCommentEditIndex(i),
    });
  }

  if (activeFilter.value === 'comments') {
    return result.filter(
      ({ activityItem }) =>
        normalizeActionType(activityItem.actionType) === ActionType.Comment
    );
  }
  if (activeFilter.value === 'moderation') {
    return result.filter(
      ({ activityItem }) =>
        normalizeActionType(activityItem.actionType) !== ActionType.Comment
    );
  }
  return result;
});
</script>

<template>
  <div class="flow-root">
    <NuxtPage v-if="hasIssueNumberInRoute" />
    <div
      v-if="feedItems.length > 1"
      class="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-gray-700"
      aria-label="Filter issue activity"
    >
      <button
        v-for="filter in feedFilters"
        :key="filter.value"
        type="button"
        :aria-pressed="activeFilter === filter.value"
        class="focus-visible:ring-brand-500 min-h-10 rounded-full px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
        :class="
          activeFilter === filter.value
            ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
        "
        @click="activeFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>
    <p
      v-if="displayFeedItems.length === 0"
      class="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300"
      role="status"
    >
      No activity matches this filter.
    </p>
    <ul v-else role="list">
      <ActivityFeedListItem
        v-for="displayItem in displayFeedItems"
        :key="displayItem.activityItem.id"
        :activity-item="displayItem.activityItem"
        :paired-activity-item="displayItem.pairedActivityItem"
        :is-original-poster="
          displayItem.activityItem.User?.username ===
            originalUserAuthorUsername ||
          displayItem.activityItem.ModerationProfile?.displayName ===
            originalModAuthorName
        "
        :related-discussion="relatedDiscussion"
        :issue="issue"
        :suspend-mod-disabled="suspendModDisabled"
        :next-revision-body="displayItem.nextRevisionBody"
        :paired-next-revision-body="displayItem.pairedNextRevisionBody"
        :comment-edit-index="displayItem.commentEditIndex"
      />
    </ul>
  </div>
</template>

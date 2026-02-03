<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_DISCUSSION } from '@/graphQLData/discussion/queries';
import {
  GET_DISCUSSION_COMMENTS,
  GET_DISCUSSION_CHANNEL_COMMENT_AGGREGATE,
  GET_DISCUSSION_CHANNEL_ROOT_COMMENT_AGGREGATE,
} from '@/graphQLData/comment/queries';
import type {
  Discussion,
  DiscussionChannel,
  Comment,
} from '@/__generated__/graphql';
import InfoBanner from '@/components/InfoBanner.vue';
import DiscussionHeader from '@/components/discussion/detail/DiscussionHeader.vue';
import DiscussionCommentsWrapper from '@/components/discussion/detail/DiscussionCommentsWrapper.vue';
import DiscussionChannelLinks from '@/components/discussion/detail/DiscussionChannelLinks.vue';
import PageNotFound from '@/components/PageNotFound.vue';
import { getSortFromQuery } from '@/components/comments/getSortFromQuery';
import { modProfileNameVar, usernameVar } from '@/cache';
import { useRoute } from 'nuxt/app';
import DiscussionBodyEditForm from './DiscussionBodyEditForm.vue';
import AlbumEditForm from './AlbumEditForm.vue';
import ArchivedDiscussionInfoBanner from './ArchivedDiscussionInfoBanner.vue';
import DiscussionLayoutManager from './DiscussionLayoutManager.vue';
import FeedbackModalManager from './FeedbackModalManager.vue';

const COMMENT_LIMIT = 50;

const props = defineProps({
  discussionId: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    default: '',
  },
  compactMode: {
    type: Boolean,
    default: false,
  },
  downloadMode: {
    type: Boolean,
    default: false,
  },
  showComments: {
    type: Boolean,
    default: true,
  },
});

const route = useRoute();
const offset = ref(0);
const channelId = computed(() => {
  if (props.channelId) {
    return props.channelId;
  }
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});
const loggedInUserModName = computed(() => modProfileNameVar.value);
const lastValidDiscussion = ref<Discussion | null>(null);

const {
  result: getDiscussionResult,
  error: getDiscussionError,
  loading: getDiscussionLoading,
  refetch: refetchDiscussion,
  onResult: onGetDiscussionResult,
} = useQuery(
  GET_DISCUSSION,
  () => ({
    id: props.discussionId,
    loggedInModName: loggedInUserModName.value,
    channelUniqueName: channelId.value,
  }),
  {
    fetchPolicy: 'cache-first',
  }
);

onGetDiscussionResult((newResult) => {
  if (newResult?.data?.discussions?.length) {
    lastValidDiscussion.value = newResult.data.discussions[0];
  }
});

const commentSort = computed(() => getSortFromQuery(route.query));

const lastValidCommentSection = ref<{
  DiscussionChannel: DiscussionChannel | null;
  Comments: Comment[];
} | null>(null);

const {
  result: getDiscussionChannelResult,
  error: getDiscussionChannelError,
  loading: getDiscussionChannelLoading,
  fetchMore: fetchMoreComments,
  refetch: refetchDiscussionChannel,
  onResult: onGetDiscussionChannelResult,
} = useQuery(
  GET_DISCUSSION_COMMENTS,
  () => ({
    discussionId: props.discussionId,
    channelUniqueName: channelId.value,
    modName: loggedInUserModName.value,
    offset: offset.value,
    limit: COMMENT_LIMIT,
    sort: commentSort.value,
  }),
  {
    fetchPolicy: 'cache-first',
  }
);

const discussionBodyEditMode = ref(false);
const albumEditMode = ref(false);
const feedbackModalManager = ref();

const discussion = computed<Discussion | null>(() => {
  const currentDiscussion = getDiscussionResult.value?.discussions[0];

  return currentDiscussion || lastValidDiscussion.value;
});

watch(commentSort, () =>
  // @ts-ignore - the sort is correctly typed.
  fetchMoreComments({ variables: { sort: commentSort.value } })
);

watch(
  () => usernameVar.value,
  (newUsername, prevUsername) => {
    if (!newUsername || newUsername === prevUsername) return;
    refetchDiscussionChannel();
  }
);

onMounted(() => {
  if (usernameVar.value) {
    refetchDiscussionChannel();
  }
});

const setLastValidCommentSection = (
  section: {
    DiscussionChannel: DiscussionChannel | null;
    Comments: Comment[];
  } | null
) => {
  lastValidCommentSection.value = section;
};

if (getDiscussionChannelResult.value?.getCommentSection) {
  setLastValidCommentSection({
    DiscussionChannel:
      getDiscussionChannelResult.value.getCommentSection.DiscussionChannel,
    Comments: getDiscussionChannelResult.value.getCommentSection.Comments || [],
  });
}

onGetDiscussionChannelResult((newResult) => {
  if (newResult?.data?.getCommentSection) {
    setLastValidCommentSection({
      DiscussionChannel: newResult.data.getCommentSection.DiscussionChannel,
      Comments: newResult.data.getCommentSection.Comments || [],
    });
  } else if (
    !getDiscussionChannelLoading.value &&
    !getDiscussionChannelError.value
  ) {
    setLastValidCommentSection(null);
  }
});

watch(
  () => props.discussionId,
  () => {
    setLastValidCommentSection(null);
  }
);

const activeDiscussionChannel = computed<DiscussionChannel | null>(() => {
  return (
    getDiscussionChannelResult.value?.getCommentSection?.DiscussionChannel ||
    lastValidCommentSection.value?.DiscussionChannel ||
    null
  );
});

const formDiscussionChannel = computed<DiscussionChannel | null>(() => {
  const discussionChannels = discussion.value?.DiscussionChannels || [];
  return (
    discussionChannels.find(
      (discussionChannel) =>
        discussionChannel.channelUniqueName === channelId.value
    ) || null
  );
});

const answers = computed(() => {
  return activeDiscussionChannel.value
    ? activeDiscussionChannel.value.Answers
    : [];
});

const isArchived = computed(() => {
  return activeDiscussionChannel.value?.archived;
});

const locked = computed(() => {
  if (isArchived.value) {
    // Archived means the mods hid this discussion from channel view.
    // If that is the case, don't allow further comments.
    return true;
  }
  // A locked discussion allows no further comments, but the mods
  // may not archive it if they think the existing discussion has merit.
  return activeDiscussionChannel.value?.locked || false;
});

const comments = computed(() => {
  return (
    getDiscussionChannelResult.value?.getCommentSection?.Comments ||
    lastValidCommentSection.value?.Comments ||
    []
  );
});

const loadedRootCommentCount = computed(() => {
  const rootComments = comments.value.filter(
    (comment: Comment) => comment.ParentComment === null
  );
  return rootComments.length;
});

const { result: getDiscussionChannelCommentAggregateResult } = useQuery(
  GET_DISCUSSION_CHANNEL_COMMENT_AGGREGATE,
  () => ({
    discussionId: props.discussionId,
    channelUniqueName: channelId.value,
  }),
  {
    fetchPolicy: 'cache-first',
  }
);

const { result: getDiscussionChannelRootCommentAggregateResult } = useQuery(
  GET_DISCUSSION_CHANNEL_ROOT_COMMENT_AGGREGATE,
  () => ({
    discussionId: props.discussionId,
    channelUniqueName: channelId.value,
  }),
  {
    fetchPolicy: 'cache-first',
  }
);

const commentCount = computed(
  () => activeDiscussionChannel.value?.CommentsAggregate?.count || 0
);

const aggregateCommentCount = computed(() => {
  return (
    getDiscussionChannelCommentAggregateResult.value?.discussionChannels[0]
      ?.CommentsAggregate?.count || 0
  );
});

const aggregateRootCommentCount = computed(() => {
  return (
    getDiscussionChannelRootCommentAggregateResult.value?.discussionChannels[0]
      ?.CommentsAggregate?.count || 0
  );
});

const loadMore = () => {
  fetchMoreComments({
    variables: {
      offset:
        getDiscussionChannelResult.value?.getCommentSection?.Comments?.length ||
        0,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      offset.value += fetchMoreResult.getCommentSection?.Comments?.length || 0;
      return {
        ...previousResult,
        getCommentSection: {
          ...previousResult.getCommentSection,
          Comments: [
            ...previousResult.getCommentSection.Comments,
            ...fetchMoreResult.getCommentSection.Comments,
          ],
        },
      };
    },
  });
};

const reachedEndOfResults = computed(
  () =>
    loadedRootCommentCount.value >= aggregateRootCommentCount.value ||
    loadedRootCommentCount.value >= commentCount.value
);

const discussionAuthor = computed(
  () => discussion.value?.Author?.username || ''
);

const previousOffset = ref(0);

const handleClickGiveFeedback = () => {
  feedbackModalManager.value?.handleClickGiveFeedback();
};

const handleClickUndoFeedback = () => {
  feedbackModalManager.value?.handleClickUndoFeedback();
};

const handleClickEditFeedback = () => {
  feedbackModalManager.value?.handleClickEditFeedback();
};

const onFeedbackSubmitted = () => {
  refetchDiscussion();
};
const handleClickEditDiscussionBody = () => {
  discussionBodyEditMode.value = true;
};

const handleClickAddAlbum = () => {
  albumEditMode.value = true;
};

const handleEditAlbum = () => {
  albumEditMode.value = true;
};
</script>

<template>
  <div class="flex w-full justify-center">
    <div
      v-if="getDiscussionLoading && !discussion"
      class="w-full space-y-6 px-4 py-6"
      aria-busy="true"
    >
      <div class="space-y-3">
        <div
          class="h-7 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
        />
        <div
          class="h-4 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
        />
        <div class="flex gap-2 pt-1">
          <div
            class="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
          />
          <div
            class="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
          />
        </div>
      </div>
      <div class="space-y-2">
        <div
          class="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"
        />
        <div
          class="h-4 w-11/12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
        />
        <div
          class="h-4 w-10/12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
        />
        <div
          class="h-4 w-9/12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
        />
      </div>
      <div class="space-y-3 pt-2">
        <div
          class="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
        />
        <div class="space-y-3">
          <div class="flex gap-3">
            <div
              class="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"
            />
            <div class="flex-1 space-y-2">
              <div
                class="h-4 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
              />
              <div
                class="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"
              />
              <div
                class="h-3 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
              />
            </div>
          </div>
          <div class="flex gap-3">
            <div
              class="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"
            />
            <div class="flex-1 space-y-2">
              <div
                class="h-4 w-1/5 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
              />
              <div
                class="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"
              />
              <div
                class="h-3 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <PageNotFound
      v-else-if="
        !discussion && !activeDiscussionChannel && !getDiscussionLoading
      "
    />
    <div
      v-else
      class="mx-1 my-4 w-full space-y-2 rounded-lg bg-white py-2 shadow-lg ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700 lg:px-4"
    >
      <div class="w-full space-y-2 overflow-hidden">
        <ErrorBanner
          v-if="getDiscussionError"
          class="mt-2 px-4"
          :text="getDiscussionError.message"
        />
        <ArchivedDiscussionInfoBanner
          v-if="isArchived"
          :channel-id="channelId"
          :discussion-channel-id="activeDiscussionChannel?.id || ''"
        />
        <InfoBanner
          v-else-if="locked"
          text="This discussion is locked. New comments cannot be added."
        />
        <div v-if="discussion" class="w-full">
          <div class="w-full px-2">
            <div class="w-full rounded-lg py-2 dark:border-gray-700">
              <DiscussionHeader
                :channel-id="channelId"
                :compact-mode="compactMode"
                :discussion="discussion"
                :discussion-body-edit-mode="discussionBodyEditMode"
                :discussion-channel-id="activeDiscussionChannel?.id"
                :discussion-is-archived="isArchived || false"
                :download-mode="downloadMode"
                :show-action-menu="true"
                @cancel-edit-discussion-body="discussionBodyEditMode = false"
                @handle-click-add-album="handleClickAddAlbum"
                @handle-click-edit-body="handleClickEditDiscussionBody"
                @handle-click-give-feedback="handleClickGiveFeedback"
              />
              <div class="w-full">
                <DiscussionBodyEditForm
                  v-if="discussionBodyEditMode"
                  :discussion="discussion"
                  @close-editor="discussionBodyEditMode = false"
                />
                <AlbumEditForm
                  v-else-if="albumEditMode"
                  :discussion="discussion"
                  @close-editor="albumEditMode = false"
                />
                <DiscussionLayoutManager
                  v-else
                  :discussion="discussion"
                  :discussion-id="discussionId"
                  :channel-id="channelId"
                  :active-discussion-channel="activeDiscussionChannel"
                  :download-mode="downloadMode"
                  :aggregate-comment-count="aggregateCommentCount"
                  @discussion-refetch="refetchDiscussion"
                  @discussion-channel-refetch="refetchDiscussionChannel"
                  @handle-click-add-album="handleClickAddAlbum"
                  @edit-album="handleEditAlbum"
                  @handle-click-edit-feedback="handleClickEditFeedback"
                  @handle-click-give-feedback="handleClickGiveFeedback"
                  @handle-click-undo-feedback="handleClickUndoFeedback"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Comments section (shown for non-download mode) -->
        <div v-if="!downloadMode && showComments">
          <div class="my-2 px-2 pt-2">
            <DiscussionCommentsWrapper
              :key="activeDiscussionChannel?.id"
              :aggregate-comment-count="aggregateCommentCount || 0"
              :comments="comments"
              :discussion-author="discussionAuthor || ''"
              :discussion-channel="activeDiscussionChannel || undefined"
              :form-discussion-channel="formDiscussionChannel || undefined"
              :channel-id="channelId"
              :enable-feedback="
                activeDiscussionChannel?.Channel?.feedbackEnabled ?? true
              "
              :loading="getDiscussionChannelLoading"
              :locked="locked"
              :mod-name="loggedInUserModName"
              :previous-offset="previousOffset"
              :reached-end-of-results="reachedEndOfResults"
              :answers="answers"
              @load-more="loadMore"
            />
          </div>
          <DiscussionChannelLinks
            v-if="discussion && (discussion as Discussion).DiscussionChannels"
            :channel-id="activeDiscussionChannel?.channelUniqueName || ''"
            :discussion-channels="(discussion as Discussion).DiscussionChannels"
          />
        </div>
      </div>
    </div>
    <FeedbackModalManager
      ref="feedbackModalManager"
      :discussion-id="discussionId"
      :logged-in-user-mod-name="loggedInUserModName"
      :active-discussion-channel="activeDiscussionChannel"
      @feedback-submitted="onFeedbackSubmitted"
    />
  </div>
</template>

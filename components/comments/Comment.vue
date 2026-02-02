<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'nuxt/app';
import type { PropType } from 'vue';
import type { ApolloError } from '@apollo/client/core';
import type { Comment } from '@/__generated__/graphql';
import type { CreateReplyInputData } from '@/types/Comment';
import TextEditor from '../TextEditor.vue';
import ChildComments from './ChildComments.vue';
import CommentButtons from './CommentButtons.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import EllipsisHorizontal from '@/components/icons/EllipsisHorizontal.vue';
import RightArrowIcon from '@/components/icons/RightArrowIcon.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import CommentHeader from './CommentHeader.vue';
import { usernameVar } from '@/cache';
import { MAX_CHARS_IN_COMMENT } from '@/utils/constants';
import type { BotSuggestion } from '@/utils/botMentions';
import ArchivedCommentText from './ArchivedCommentText.vue';
import { useCommentPermissions } from '@/composables/useCommentPermissions';
import { useBestAnswerMutations } from '@/composables/useBestAnswerMutations';
import { useCommentPermalink } from '@/composables/useCommentPermalink';
import { getCommentMenuItems } from '@/utils/headerPermissionUtils';

const MAX_COMMENT_DEPTH = 5;
const SHOW_MORE_THRESHOLD = 1000;

type DeleteCommentInputData = {
  commentId: string;
  parentCommentId: string;
  replyCount: number;
};

export type HandleFeedbackInput = {
  commentData: Comment;
  parentCommentId: string;
};

export type HandleEditFeedbackInput = {
  commentData: Comment;
};

const props = defineProps({
  commentData: {
    type: Object as PropType<Comment>,
    required: true,
  },
  commentInProcess: {
    type: Boolean,
    default: false,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  depth: {
    type: Number,
    required: true,
  },
  editCommentError: {
    type: Object as PropType<ApolloError | null>,
    required: false,
    default: null,
  },
  editFormOpenAtCommentID: {
    type: String,
    default: '',
  },
  enableFeedback: {
    type: Boolean,
    default: true,
  },
  goToPermalinkOnClick: {
    type: Boolean,
    default: false,
  },
  isPermalinked: {
    type: Boolean,
    default: false,
  },
  locked: {
    type: Boolean,
    default: false,
  },
  modProfileName: {
    type: String,
    required: false,
    default: '',
  },
  parentCommentId: {
    type: String,
    default: '',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  replyFormOpenAtCommentID: {
    type: String,
    default: '',
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  showChannel: {
    type: Boolean,
    default: false,
  },
  showCommentButtons: {
    type: Boolean,
    default: true,
  },
  showContextLink: {
    type: Boolean,
    default: false,
  },
  originalPoster: {
    type: String,
    required: false,
    default: '',
  },
  lengthOfCommentInProgress: {
    type: Number,
    default: 1,
  },
  replyHasBotMention: {
    type: Boolean,
    default: false,
  },
  botSuggestions: {
    type: Array as PropType<BotSuggestion[]>,
    default: () => [],
  },
  botUsernames: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  showLabel: {
    type: Boolean,
    default: false,
  },
  answers: {
    type: Array as PropType<Comment[]>,
    default: () => [],
  },
});

const emit = defineEmits([
  'createComment',
  'delete-comment',
  'click-edit-comment',
  'openEditCommentEditor',
  'updateEditCommentInput',
  'updateCreateReplyCommentInput',
  'showCopiedLinkNotification',
  'clickReport',
  'clickFeedback',
  'clickUndoFeedback',
  'clickEditFeedback',
  'handleViewFeedback',
  'startCommentSave',
  'openReplyEditor',
  'hideReplyEditor',
  'hideEditCommentEditor',
  'saveEdit',
  'openModProfile',
  'scrollToTop',
  'handleClickArchive',
  'handleClickArchiveAndSuspend',
  'handleClickUnarchive',
  'update-edit-comment-input',
  'showMarkedAsBestAnswerNotification',
  'showUnmarkedAsBestAnswerNotification',
]);

const route = useRoute();
const { discussionId, eventId, issueNumber } = route.params;

// Compute forumId from comment data or route
const forumId = computed(() => {
  if (props.commentData?.Channel?.uniqueName) {
    return props.commentData.Channel.uniqueName;
  }
  if (props.commentData?.DiscussionChannel?.channelUniqueName) {
    return props.commentData.DiscussionChannel.channelUniqueName;
  }
  if (props.commentData?.Event?.EventChannels?.[0]?.channelUniqueName) {
    return props.commentData.Event.EventChannels[0].channelUniqueName;
  }
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return '';
});

// Use the permission composable
const { userPermissions } = useCommentPermissions(forumId);

// Reactive refs for the best answer composable
const commentIdRef = computed(() => props.commentData.id);
const originalPosterRef = computed(() => props.originalPoster);
const answersRef = computed(() => props.answers);
const discussionIdRef = computed(() => {
  const discussionIdFromRoute =
    typeof discussionId === 'string'
      ? discussionId
      : Array.isArray(discussionId)
        ? discussionId[0]
        : undefined;
  return discussionIdFromRoute || props.commentData.DiscussionChannel?.discussionId;
});

// Use the best answer mutations composable
const {
  isDiscussionAuthor,
  isMarkedAsAnswer,
  handleMarkAsBestAnswer,
  handleUnmarkAsBestAnswer,
} = useBestAnswerMutations({
  commentId: commentIdRef,
  forumId,
  discussionId: discussionIdRef,
  originalPoster: originalPosterRef,
  answers: answersRef,
  onMarked: () => {
    emit('showMarkedAsBestAnswerNotification', true);
    setTimeout(() => {
      emit('showMarkedAsBestAnswerNotification', false);
    }, 3000);
  },
  onUnmarked: () => {
    emit('showUnmarkedAsBestAnswerNotification', true);
    setTimeout(() => {
      emit('showUnmarkedAsBestAnswerNotification', false);
    }, 3000);
  },
});

// Use the permalink composable
const commentDataRef = computed(() => props.commentData);
const {
  canShowPermalink,
  permalinkObject,
  copyLink: copyLinkFromComposable,
} = useCommentPermalink({
  commentData: commentDataRef,
  forumId,
});

// Wrap copyLink to emit notification
const copyLink = async () => {
  await copyLinkFromComposable((value: boolean) => {
    emit('showCopiedLinkNotification', value);
  });
};

const permalinkedCommentId = route.params.commentId;
const isHighlighted = computed(() => {
  return props.isPermalinked || permalinkedCommentId === props.commentData.id;
});

const replyCount = computed(() => {
  if (props.commentData.ChildCommentsAggregate) {
    return props.commentData.ChildCommentsAggregate.count;
  }
  return 0;
});

const textCopy = computed(() => props.commentData.text);

// Compute menu items using the utility function
const commentMenuItems = computed(() => {
  const isOwnComment =
    props.commentData?.CommentAuthor?.__typename === 'User' &&
    props.commentData?.CommentAuthor?.username === usernameVar.value;

  return getCommentMenuItems({
    isOwnComment,
    isArchived: !!props.commentData.archived,
    isDiscussionAuthor: isDiscussionAuthor.value,
    isMarkedAsAnswer: isMarkedAsAnswer.value,
    depth: props.depth,
    discussionId: typeof discussionId === 'string' ? discussionId : undefined,
    userPermissions: userPermissions.value,
    isLoggedIn: !!usernameVar.value,
    enableFeedback: props.enableFeedback,
    canShowPermalink: canShowPermalink.value,
    hasPermalinkObject: Object.keys(permalinkObject.value ?? {}).length > 0,
    hasFeedbackComments: (props.commentData.FeedbackComments?.length ?? 0) > 0,
  });
});

const showReplies = ref(true);
const highlight = ref(false);
const editorId = 'texteditor';

const maxCommentDepth = MAX_COMMENT_DEPTH;

function createComment(parentCommentId: string) {
  emit('createComment', parentCommentId);
}

function handleDelete(input: DeleteCommentInputData) {
  emit('delete-comment', input);
}

function handleEdit(commentData: Comment) {
  emit('click-edit-comment', commentData);
}

function updateExistingComment(text: string, depth: number) {
  emit('update-edit-comment-input', text, depth === 1);
}

function updateNewComment(input: CreateReplyInputData) {
  const { text, parentCommentId, depth } = input;
  if (parentCommentId) {
    emit('updateCreateReplyCommentInput', {
      text,
      parentCommentId,
      depth,
    });
  }
}

function handleReport() {
  emit('clickReport', props.commentData);
}

function handleFeedback(input: HandleFeedbackInput) {
  emit('clickFeedback', input);
}

function handleUndoFeedback(input: HandleFeedbackInput) {
  emit('clickUndoFeedback', input);
}

function handleEditFeedback(input: HandleEditFeedbackInput) {
  emit('clickEditFeedback', input);
}

const showEditCommentForm = computed(() => {
  return (
    !props.readonly && props.editFormOpenAtCommentID === props.commentData.id
  );
});

const saveDisabled = computed(() => {
  return (
    props.lengthOfCommentInProgress === 0 ||
    props.lengthOfCommentInProgress > MAX_CHARS_IN_COMMENT
  );
});
const label = computed(() => {
  let label = '';
  if (props.showLabel) {
    if (props.commentData.GivesFeedbackOnDiscussion) {
      label = 'Feedback on Discussion';
    } else if (props.commentData.GivesFeedbackOnEvent) {
      label = 'Feedback on Event';
    } else if (props.commentData.GivesFeedbackOnComment) {
      label = 'Feedback on Comment';
    } else if (props.commentData.Issue) {
      label = 'Comment on Issue';
    }
  }
  return label;
});
</script>

<template>
  <div>
    <div
      :class="[
        depth > 1
          ? 'ml-1 border-l border-gray-300 pl-4 pt-2 dark:border-gray-600'
          : '',
      ]"
      class="flex w-full"
    >
      <div :class="'text-sm'" class="w-full">
        <div
          :class="[
            isHighlighted
              ? 'rounded-md border border-orange-600 bg-orange-100 p-2 dark:bg-orange-950'
              : isMarkedAsAnswer
                ? 'dark:bg-green-950 rounded-md border border-green-600 bg-green-100 p-2'
                : 'dark:bg-gray-950',
          ]"
          class="flex w-full"
          data-testid="comment"
        >
          <div class="w-full flex-col rounded-lg">
            <CommentHeader
              :comment-data="props.commentData"
              :is-highlighted="isHighlighted"
              :parent-comment-id="props.parentCommentId"
              :show-context-link="props.showContextLink"
              :show-channel="props.showChannel"
              :original-poster="props.originalPoster"
              :label="label"
              :is-answer="isMarkedAsAnswer"
              :bot-usernames="props.botUsernames"
            />
            <div
              class="ml-4 flex-grow border-l border-gray-300 pl-4 dark:border-gray-600"
            >
              <div class="w-full dark:text-gray-200">
                <div class="w-full overflow-auto">
                  <ArchivedCommentText
                    v-if="props.commentData?.archived"
                    :channel-id="forumId"
                    :comment-id="props.commentData.id"
                  />
                  <div
                    v-else-if="
                      props.commentData.text &&
                      props.editFormOpenAtCommentID !== props.commentData.id
                    "
                    class="ml-3"
                    :class="[
                      props.goToPermalinkOnClick ? 'cursor-pointer' : '',
                    ]"
                  >
                    <ClientOnly>
                      <MarkdownPreview
                        v-if="
                          !goToPermalinkOnClick ||
                          !Object.keys(permalinkObject ?? {}).length
                        "
                        :key="textCopy || ''"
                        :text="textCopy || ''"
                        :word-limit="SHOW_MORE_THRESHOLD"
                        :disable-gallery="false"
                      />
                      <router-link
                        v-else-if="Object.keys(permalinkObject ?? {}).length"
                        :to="permalinkObject || {}"
                      >
                        <MarkdownPreview
                          :key="textCopy || ''"
                          :text="textCopy || ''"
                          :word-limit="SHOW_MORE_THRESHOLD"
                          :disable-gallery="true"
                        />
                      </router-link>
                      <template #fallback>
                        <MarkdownPreview
                          :key="textCopy || ''"
                          :text="textCopy || ''"
                          :word-limit="SHOW_MORE_THRESHOLD"
                          :disable-gallery="false"
                        />
                      </template>
                    </ClientOnly>
                  </div>
                  <TextEditor
                    v-if="showEditCommentForm"
                    id="editExistingComment"
                    class="mb-2 mt-3 p-1"
                    :initial-value="props.commentData.text || ''"
                    :editor-id="editorId"
                    :show-char-counter="true"
                    :max-chars="MAX_CHARS_IN_COMMENT"
                    @update="
                      (text) =>
                        emit(
                          'update-edit-comment-input',
                          text,
                          props.depth === 1
                        )
                    "
                  />
                  <ErrorBanner
                    v-if="
                      props.editCommentError &&
                      !props.readonly &&
                      props.editFormOpenAtCommentID === props.commentData.id
                    "
                    :text="
                      props.editCommentError && props.editCommentError.message
                    "
                  />
                </div>
                <div class="flex items-center">
                  <CommentButtons
                    v-if="forumId && props.showCommentButtons"
                    class="mb-1 ml-2"
                    :comment-data="props.commentData"
                    :enable-feedback="props.enableFeedback"
                    :depth="props.depth"
                    :locked="props.locked"
                    :parent-comment-id="props.parentCommentId"
                    :show-edit-comment-field="
                      props.editFormOpenAtCommentID === props.commentData.id
                    "
                    :show-replies="showReplies"
                    :reply-form-open-at-comment-i-d="
                      props.replyFormOpenAtCommentID
                    "
                    :comment-in-process="
                      props.commentInProcess && !props.editCommentError
                    "
                    :save-disabled="saveDisabled"
                    :length-of-comment-in-progress="lengthOfCommentInProgress"
                    :reply-has-bot-mention="props.replyHasBotMention"
                    :bot-suggestions="props.botSuggestions"
                    :is-permalinked="isHighlighted"
                    :is-marked-as-answer="isMarkedAsAnswer"
                    @start-comment-save="emit('startCommentSave', $event)"
                    @click-edit-comment="handleEdit"
                    @create-comment="createComment"
                    @open-reply-editor="
                      (commentId) => emit('openReplyEditor', commentId)
                    "
                    @hide-reply-editor="emit('hideReplyEditor')"
                    @open-edit-comment-editor="
                      emit('openEditCommentEditor', props.commentData.id)
                    "
                    @hide-edit-comment-editor="emit('hideEditCommentEditor')"
                    @hide-replies="showReplies = false"
                    @open-mod-profile="emit('openModProfile')"
                    @save-edit="emit('saveEdit')"
                    @show-replies="showReplies = true"
                    @update-new-comment="updateNewComment"
                    @click-feedback="
                      () =>
                        handleFeedback({
                          commentData: props.commentData,
                          parentCommentId: props.parentCommentId,
                        })
                    "
                    @handle-view-feedback="
                      emit('handleViewFeedback', props.commentData.id)
                    "
                    @click-undo-feedback="
                      () =>
                        handleUndoFeedback({
                          commentData: props.commentData,
                          parentCommentId: props.parentCommentId,
                        })
                    "
                    @click-edit-feedback="
                      () =>
                        handleEditFeedback({
                          commentData: props.commentData,
                        })
                    "
                  >
                    <MenuButton
                      v-if="commentMenuItems.length > 0"
                      :data-testid="'commentMenu'"
                      :items="commentMenuItems"
                      :is-marked-as-answer="isMarkedAsAnswer"
                      :aria-label="'Comment actions'"
                      @copy-link="copyLink"
                      @handle-edit="() => handleEdit(props.commentData)"
                      @click-report="handleReport"
                      @click-feedback="
                        () => {
                          handleFeedback({
                            commentData: props.commentData,
                            parentCommentId: props.parentCommentId,
                          });
                        }
                      "
                      @click-undo-feedback="
                        () =>
                          handleUndoFeedback({
                            commentData: props.commentData,
                            parentCommentId: props.parentCommentId,
                          })
                      "
                      @handle-view-feedback="
                        emit('handleViewFeedback', props.commentData.id)
                      "
                      @handle-delete="
                        () => {
                          const deleteCommentInput = {
                            commentId: props.commentData.id,
                            parentCommentId: props.parentCommentId,
                            replyCount: replyCount,
                          };
                          handleDelete(deleteCommentInput);
                        }
                      "
                      @click-edit-feedback="
                        () =>
                          handleEditFeedback({ commentData: props.commentData })
                      "
                      @handle-click-archive="
                        () => {
                          emit('handleClickArchive', props.commentData.id);
                        }
                      "
                      @handle-click-archive-and-suspend="
                        () => {
                          emit(
                            'handleClickArchiveAndSuspend',
                            props.commentData.id
                          );
                        }
                      "
                      @handle-click-unarchive="
                        () => {
                          emit('handleClickUnarchive', props.commentData.id);
                        }
                      "
                      @handle-mark-as-best-answer="handleMarkAsBestAnswer"
                      @handle-unmark-as-best-answer="handleUnmarkAsBestAnswer"
                    >
                      <EllipsisHorizontal
                        class="h-5 w-5 cursor-pointer hover:text-black dark:text-gray-300 dark:hover:text-white"
                      />
                    </MenuButton>
                  </CommentButtons>
                </div>
              </div>
            </div>
          </div>
        </div>
        <nuxt-link
          v-if="
            canShowPermalink &&
            replyCount > 0 &&
            props.depth + 1 > maxCommentDepth
          "
          class="flex w-full cursor-pointer items-center gap-1 border-gray-300 pl-4 text-gray-400 underline dark:border-gray-500 dark:text-gray-300"
          :to="permalinkObject"
          @click.prevent="emit('scrollToTop')"
        >
          Continue thread
          <RightArrowIcon class="h-4 w-4" />
        </nuxt-link>
        <div
          v-else-if="replyCount > 0 && showReplies"
          id="childComments"
          class="ml-3 w-full border-gray-300 dark:border-gray-600"
        >
          <ChildComments
            v-slot="slotProps"
            :parent-comment-id="props.commentData.id"
            :mod-name="props.modProfileName"
            @mouseenter="highlight = true"
            @mouseleave="highlight = false"
          >
            <div
              v-for="childComment in slotProps.comments"
              :key="childComment.id"
            >
              <Comment
                v-if="childComment.id !== permalinkedCommentId"
                :compact="true"
                :comment-data="childComment"
                :depth="props.depth + 1"
                :locked="props.locked"
                :parent-comment-id="props.commentData.id"
                :comment-in-process="props.commentInProcess"
                :edit-form-open-at-comment-i-d="editFormOpenAtCommentID"
                :reply-form-open-at-comment-i-d="props.replyFormOpenAtCommentID"
                :mod-profile-name="props.modProfileName"
                :original-poster="props.originalPoster"
                :length-of-comment-in-progress="props.lengthOfCommentInProgress"
                :answers="props.answers"
                :bot-usernames="props.botUsernames"
                @start-comment-save="emit('startCommentSave')"
                @click-edit-comment="handleEdit"
                @click-report="emit('clickReport', $event)"
                @delete-comment="(input) => emit('delete-comment', input)"
                @create-comment="emit('createComment')"
                @save-edit="emit('saveEdit')"
                @update-create-reply-comment-input="updateNewComment"
                @update-edit-comment-input="updateExistingComment"
                @show-copied-link-notification="
                  emit('showCopiedLinkNotification', $event)
                "
                @open-mod-profile="emit('openModProfile')"
                @scroll-to-top="emit('scrollToTop')"
                @open-reply-editor="
                  ($event: string) => emit('openReplyEditor', $event)
                "
                @hide-reply-editor="emit('hideReplyEditor')"
                @open-edit-comment-editor="
                  emit('openEditCommentEditor', childComment.id)
                "
                @hide-edit-comment-editor="emit('hideEditCommentEditor')"
                @click-feedback="handleFeedback"
                @click-undo-feedback="handleUndoFeedback"
                @handle-view-feedback="
                  (commentId: string) => emit('handleViewFeedback', commentId)
                "
                @handle-click-archive="
                  (commentId: string) => {
                    emit('handleClickArchive', commentId);
                  }
                "
                @handle-click-archive-and-suspend="
                  (commentId: string) => {
                    emit('handleClickArchiveAndSuspend', commentId);
                  }
                "
                @handle-click-unarchive="
                  (commentId: string) => emit('handleClickUnarchive', commentId)
                "
              />
            </div>
          </ChildComments>
        </div>
      </div>
    </div>
  </div>
</template>

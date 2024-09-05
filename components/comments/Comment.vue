<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { useRoute, useRouter } from "vue-router";
import useClipboard from "vue-clipboard3";
import type { PropType } from "vue";
import type { ApolloError } from "@apollo/client/core";
import type { Comment } from "@/__generated__/graphql";
import type { CreateReplyInputData } from "@/types/Comment";
import TextEditor from "../TextEditor.vue";
import ChildComments from "./ChildComments.vue";
import CommentButtons from "./CommentButtons.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import MenuButton, { ALLOWED_ICONS } from "@/components/MenuButton.vue";
import EllipsisHorizontal from "@/components/icons/EllipsisHorizontal.vue";
import RightArrowIcon from "@/components/icons/RightArrowIcon.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import CommentHeader from "./CommentHeader.vue";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";

const MAX_COMMENT_DEPTH = 5;

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
    default: "",
  },
  enableFeedback: {
    type: Boolean,
    default: true,
  },
  goToPermalinkOnClick: {
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
    default: "",
  },
  parentCommentId: {
    type: String,
    default: "",
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  replyFormOpenAtCommentID: {
    type: String,
    default: "",
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
    default: "",
  },
});

const emit = defineEmits([
  "createComment",
  "deleteComment",
  "clickEditComment",
  "openEditCommentEditor",
  "updateEditCommentInput",
  "updateCreateReplyCommentInput",
  "showCopiedLinkNotification",
  "clickReport",
  "clickFeedback",
  "clickUndoFeedback",
  "clickEditFeedback",
  "handleViewFeedback",
  "startCommentSave",
  "openReplyEditor",
  "hideReplyEditor",
  "hideEditCommentEditor",
  "saveEdit",
  "openModProfile",
  "scrollToTop",
]);

const route = useRoute();
const router = useRouter();
const { discussionId, channelId } = route.params;
const { toClipboard } = useClipboard();

const isHighlighted = computed(() => {
  return (
    (route.name === "DiscussionCommentPermalink" ||
      route.name === "EventCommentPermalink") &&
    props.commentData?.id === route.params.commentId
  );
});

const replyCount = computed(() => {
  if (props.commentData.ChildCommentsAggregate) {
    return props.commentData.ChildCommentsAggregate.count;
  }
  return 0;
});

const textCopy = computed(() => props.commentData.text);

const { result: localUsernameResult, loading: localUsernameLoading, error: localUsernameError } = useQuery(GET_LOCAL_USERNAME);

const canShowPermalink = props.commentData.DiscussionChannel || (discussionId && channelId);

const permalinkObject = computed(() => {
  if (!canShowPermalink) {
    return {};
  }
  const discussionIdInLink = discussionId || props.commentData?.DiscussionChannel?.discussionId;

  if (discussionIdInLink) {
    return {
      name: "DiscussionCommentPermalink",
      params: {
        discussionId: discussionIdInLink,
        commentId: props.commentData.id,
        channelId: channelId || props.commentData?.DiscussionChannel?.channelUniqueName,
      },
    };
  }

  return {
    name: "EventCommentPermalink",
    params: {
      eventId: props.commentData.Event?.id,
      commentId: props.commentData.id,
    },
  };
});

const basePath = window.location.origin;
const permalink = `${basePath}${router.resolve(permalinkObject.value).href}`;

const copyLink = async () => {
  try {
    await toClipboard(permalink);
    emit("showCopiedLinkNotification", true);
  } catch (e: any) {
    throw new Error(e);
  }
  setTimeout(() => {
    emit("showCopiedLinkNotification", false);
  }, 2000);
};

const username = computed(() => {
  if (localUsernameLoading.value || localUsernameError.value) {
    return "";
  }
  return localUsernameResult.value;
});

const commentMenuItems = computed(() => {
  let out: any[] = [];

  if (props.enableFeedback) {
    out = out.concat([
      {
        label: "View Feedback",
        value: "",
        event: "handleViewFeedback",
        icon: ALLOWED_ICONS.VIEW_FEEDBACK,
      },
    ]);
  }

  if (props.commentData?.CommentAuthor?.username === username.value.username) {
    out = out.concat([
      {
        label: "Edit",
        value: "",
        event: "handleEdit",
        icon: ALLOWED_ICONS.EDIT,
      },
      {
        label: "Delete",
        value: "",
        event: "handleDelete",
        icon: ALLOWED_ICONS.DELETE,
      },
    ]);
  } else {
    if (props.modProfileName) {
      out = out.concat([
        {
          label: "Report",
          value: "",
          event: "clickReport",
          icon: ALLOWED_ICONS.REPORT,
        },
      ]);
    }

    if (props.enableFeedback) {
      if (props.commentData.FeedbackComments?.length === 0) {
        if (props.modProfileName) {
          out.push({
            label: "Give Feedback",
            value: "",
            event: "clickFeedback",
            icon: ALLOWED_ICONS.GIVE_FEEDBACK,
          });
        }
      } else {
        out.push({
          label: "Undo Feedback",
          value: "",
          event: "clickUndoFeedback",
          icon: ALLOWED_ICONS.UNDO,
        });
        out.push({
          label: "Edit Feedback",
          value: "",
          event: "clickEditFeedback",
          icon: ALLOWED_ICONS.EDIT,
        });
      }
    }
  }
  if (canShowPermalink) {
    out.push({
      label: "Copy Link",
      value: "",
      event: "copyLink",
      icon: ALLOWED_ICONS.COPY_LINK,
    });
  }
  return out;
});

const showReplies = ref(true);
const highlight = ref(false);
const editorId = "texteditor";
const permalinkedCommentId = route.params.commentId;
const maxCommentDepth = MAX_COMMENT_DEPTH;

function createComment(parentCommentId: string) {
  emit("createComment", parentCommentId);
}

function handleDelete(input: DeleteCommentInputData) {
  emit("deleteComment", input);
}

function handleEdit(commentData: Comment) {
  emit("clickEditComment", commentData);
  emit("openEditCommentEditor", commentData.id);
}

function updateExistingComment(text: string, depth: number) {
  emit("updateEditCommentInput", text, depth === 1);
}

function updateNewComment(input: CreateReplyInputData) {
  const { text, parentCommentId, depth } = input;
  if (parentCommentId) {
    emit("updateCreateReplyCommentInput", {
      text,
      parentCommentId,
      depth,
    });
  }
}

function handleReport() {
  emit("clickReport", props.commentData);
}

function handleFeedback(input: HandleFeedbackInput) {
  emit("clickFeedback", input);
}

function handleUndoFeedback(input: HandleFeedbackInput) {
  emit("clickUndoFeedback", input);
}

function handleEditFeedback(input: HandleEditFeedbackInput) {
  emit("clickEditFeedback", input);
}
</script>

<template>
  <div>
    <div
      :class="[
        depth > 1
          ? 'border-l border-gray-300 pl-4 pt-2 dark:border-gray-600'
          : '',
      ]"
      class="flex w-full"
    >
      <div :class="'text-sm'" class="w-full">
        <div
          :class="[
            isHighlighted
              ? 'rounded-md border border-blue-500'
              : 'dark:bg-gray-950 ',
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
            />
            <div
              class="ml-3 flex-grow border-l border-gray-300 pl-4 dark:border-gray-500"
            >
              <div class="w-full dark:text-gray-200">
                <div class="w-full overflow-auto">
                  <div
                    v-if="
                      props.commentData.text &&
                      props.editFormOpenAtCommentID !== props.commentData.id
                    "
                    class="-ml-2"
                    :class="[props.goToPermalinkOnClick ? 'cursor-pointer' : '']"
                  >
                    <MarkdownPreview
                      :key="textCopy || ''"
                      :text="textCopy || ''"
                      :word-limit="1000"
                      :disable-gallery="props.goToPermalinkOnClick"
                      @click="
                        () => {
                          if (props.goToPermalinkOnClick) {
                            router.push(permalinkObject);
                          }
                        }
                      "
                    />
                  </div>
                  <TextEditor
                    v-if="
                      !props.readonly && props.editFormOpenAtCommentID === props.commentData.id
                    "
                    id="editExistingComment"
                    class="mb-2 mt-3 p-1"
                    :initial-value="props.commentData.text || ''"
                    :editor-id="editorId"
                    @update="updateExistingComment($event, props.depth)"
                  />
                  <ErrorBanner
                    v-if="
                      props.editCommentError &&
                      !props.readonly &&
                      props.editFormOpenAtCommentID === props.commentData.id
                    "
                    :text="props.editCommentError && props.editCommentError.message"
                  />
                </div>
                <div class="flex items-center">
                  <CommentButtons
                    v-if="channelId && props.showCommentButtons"
                    class="mb-1 ml-1"
                    :class="[
                      props.editFormOpenAtCommentID === props.commentData.id ? 'ml-1' : '',
                    ]"
                    :comment-data="props.commentData"
                    :enable-feedback="props.enableFeedback"
                    :depth="props.depth"
                    :locked="props.locked"
                    :parent-comment-id="props.parentCommentId"
                    :show-edit-comment-field="
                      props.editFormOpenAtCommentID === props.commentData.id
                    "
                    :show-replies="showReplies"
                    :reply-form-open-at-comment-i-d="props.replyFormOpenAtCommentID"
                    :comment-in-process="props.commentInProcess && !props.editCommentError"
                    @start-comment-save="emit('startCommentSave')"
                    @click-edit-comment="handleEdit"
                    @create-comment="createComment"
                    @open-reply-editor="(commentId) => emit('openReplyEditor', commentId)"
                    @hide-reply-editor="emit('hideReplyEditor')"
                    @open-edit-comment-editor="emit('openEditCommentEditor', props.commentData.id)"
                    @hide-edit-comment-editor="emit('hideEditCommentEditor')"
                    @hide-replies="showReplies = false"
                    @open-mod-profile="emit('openModProfile')"
                    @save-edit="emit('saveEdit')"
                    @show-replies="showReplies = true"
                    @update-new-comment="updateNewComment"
                    @click-feedback="
                      () => handleFeedback({
                        commentData: props.commentData,
                        parentCommentId: props.parentCommentId,
                      })
                    "
                    @handle-view-feedback="emit('handleViewFeedback', props.commentData.id)"
                    @click-undo-feedback="
                      () => handleUndoFeedback({
                        commentData: props.commentData,
                        parentCommentId: props.parentCommentId,
                      })
                    "
                    @click-edit-feedback="
                      () => handleEditFeedback({
                        commentData: props.commentData,
                      })
                    "
                  >
                    <MenuButton
                      v-if="commentMenuItems.length > 0"
                      id="commentMenu"
                      :items="commentMenuItems"
                      @copy-link="copyLink"
                      @handle-edit="() => handleEdit(props.commentData)"
                      @click-report="handleReport"
                      @click-feedback="
                        () => handleFeedback({
                          commentData: props.commentData,
                          parentCommentId: props.parentCommentId,
                        })
                      "
                      @click-undo-feedback="
                        () => handleUndoFeedback({ commentData: props.commentData, parentCommentId: props.parentCommentId })
                      "
                      @handle-view-feedback="emit('handleViewFeedback', props.commentData.id)"
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
                        () => handleEditFeedback({ commentData: props.commentData })
                      "
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
        <router-link
          v-if="
            canShowPermalink && replyCount > 0 && props.depth + 1 > maxCommentDepth
          "
          class="flex w-full cursor-pointer items-center gap-1 border-gray-300 pl-4 text-gray-400 underline dark:border-gray-500 dark:text-gray-300"
          :to="permalinkObject"
          @click.prevent="emit('scrollToTop')"
        >
          Continue thread
          <RightArrowIcon class="h-4 w-4" />
        </router-link>
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
                :edit-form-open-at-comment-i-d="props.editFormOpenAtCommentID"
                :reply-form-open-at-comment-i-d="props.replyFormOpenAtCommentID"
                :mod-profile-name="props.modProfileName"
                :original-poster="props.originalPoster"
                @start-comment-save="emit('startCommentSave')"
                @click-edit-comment="emit('clickEditComment', $event)"
                @delete-comment="handleDelete"
                @create-comment="emit('createComment')"
                @save-edit="emit('saveEdit')"
                @update-create-reply-comment-input="updateNewComment"
                @update-edit-comment-input="updateExistingComment"
                @show-copied-link-notification="emit('showCopiedLinkNotification', $event)"
                @open-mod-profile="emit('openModProfile')"
                @scroll-to-top="emit('scrollToTop')"
                @open-reply-editor="($event: string) => emit('openReplyEditor', $event)"
                @hide-reply-editor="emit('hideReplyEditor')"
                @open-edit-comment-editor="emit('openEditCommentEditor', childComment.id)"
                @hide-edit-comment-editor="emit('hideEditCommentEditor')"
                @click-feedback="handleFeedback"
                @click-undo-feedback="handleUndoFeedback"
                @handle-view-feedback="(commentId: string) => emit('handleViewFeedback', commentId)"
              />
            </div>
          </ChildComments>
        </div>
      </div>
    </div>
  </div>
</template>

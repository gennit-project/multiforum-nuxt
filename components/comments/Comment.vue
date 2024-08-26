<script lang="ts">
import { defineComponent, PropType, ref, computed } from "vue";
import { CreateReplyInputData } from "@/types/Comment";
import "md-editor-v3/lib/style.css";
import { useQuery } from "@vue/apollo-composable";
import TextEditor from "../forms/TextEditor.vue";
import ChildComments from "./ChildComments.vue";
import CommentButtons from "./CommentButtons.vue";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import { getLinksInText } from "../utils";
import { ApolloError, gql } from "@apollo/client/core";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import { useRoute, useRouter } from "vue-router";
import { Comment } from "@/__generated__/graphql";
import MenuButton from "@/components/MenuButton.vue";
import EllipsisHorizontal from "../icons/EllipsisHorizontal.vue";
import RightArrowIcon from "../icons/RightArrowIcon.vue";
import useClipboard from "vue-clipboard3";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { ALLOWED_ICONS } from "@/components/MenuButton.vue";
import CommentHeader from "./CommentHeader.vue";

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

export default defineComponent({
  name: "CommentComponent",
  components: {
    ChildComments,
    CommentButtons,
    CommentHeader,
    EllipsisHorizontal,
    ErrorBanner,
    MarkdownPreview,
    MenuButton,
    RightArrowIcon,
    TextEditor,
  },
  props: {
    commentData: {
      type: Object as PropType<Comment>,
      required: true,
    },
    commentInProcess: {
      // Used to show loading state in save comment button.
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
  },
  setup(props, { emit }) {
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

    const GET_THEME = gql`
      query getTheme {
        theme @client
      }
    `;

    const {
      result: themeResult,
      loading: themeLoading,
      error: themeError,
    } = useQuery(GET_THEME);

    const theme = computed(() => {
      if (themeLoading.value || themeError.value) {
        return "";
      }
      return themeResult.value.theme;
    });

    let replyCount = computed(() => {
      if (props.commentData.ChildCommentsAggregate) {
        return props.commentData.ChildCommentsAggregate.count;
      }
      return 0;
    });

    const textCopy = computed(() => {
      return props.commentData.text;
    });
    const {
      result: localUsernameResult,
      loading: localUsernameLoading,
      error: localUsernameError,
    } = useQuery(GET_LOCAL_USERNAME);

    const canShowPermalink =
      props.commentData.DiscussionChannel || (discussionId && channelId);

    const permalinkObject = computed(() => {
      if (!canShowPermalink) {
        return {};
      }
      const discussionIdInLink =
        discussionId || props.commentData?.DiscussionChannel?.discussionId;

      if (discussionIdInLink) {
        return {
          name: "DiscussionCommentPermalink",
          params: {
            discussionId: discussionIdInLink,
            commentId: props.commentData.id,
            channelId:
              channelId ||
              props.commentData?.DiscussionChannel?.channelUniqueName,
          },
        };
      }

      // if discussionId is not present, assume it is an event comment
      return {
        name: "EventCommentPermalink",
        params: {
          eventId: props.commentData.Event?.id,
          commentId: props.commentData.id,
        },
      };
    });

    const basePath = window.location.origin;
    const permalink = `${basePath}${
      router.resolve(permalinkObject.value).href
    }`;

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

    const linksInText = computed(() => {
      if (!props.commentData || !props.commentData.text) {
        return [];
      }
      return getLinksInText(props.commentData.text);
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

      if (
        props.commentData?.CommentAuthor?.username === username.value.username
      ) {
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

    return {
      canShowPermalink,
      channelId,
      commentMenuItems,
      copyLink,
      discussionId,
      editorId: "texteditor",
      highlight: ref(false),
      id: `comment-preview-${props.commentData.id}`,
      isHighlighted,
      linksInText,
      maxCommentDepth: MAX_COMMENT_DEPTH,
      permalinkedCommentId: route.params.commentId,
      permalinkObject,
      replyCount,
      route,
      router,
      showReplies: ref(true),
      textCopy,
      themeLoading,
      theme,
    };
  },
  methods: {
    createComment(parentCommentId: string) {
      this.$emit("createComment", parentCommentId);
    },
    handleDelete(input: DeleteCommentInputData) {
      this.$emit("deleteComment", input);
    },
    handleEdit(commentData: Comment) {
      this.$emit("clickEditComment", commentData);
      this.$emit("openEditCommentEditor", commentData.id);
    },
    updateExistingComment(text: string, depth: number) {
      this.$emit("updateEditCommentInput", text, depth === 1);
    },
    updateNewComment(input: CreateReplyInputData) {
      const { text, parentCommentId, depth } = input;
      if (parentCommentId) {
        this.$emit("updateCreateReplyCommentInput", {
          text,
          parentCommentId,
          depth,
        });
      }
    },
    updateText(text: string) {
      this.textCopy = text;
    },
    handleReport() {
      this.$emit("clickReport", this.commentData);
    },
    handleFeedback(input: HandleFeedbackInput) {
      this.$emit("clickFeedback", input);
    },
    handleUndoFeedback(input: HandleFeedbackInput) {
      this.$emit("clickUndoFeedback", input);
    },
    handleEditFeedback(input: HandleEditFeedbackInput) {
      this.$emit("clickEditFeedback", input);
    },
  },
});
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
              :comment-data="commentData"
              :is-highlighted="isHighlighted"
              :parent-comment-id="parentCommentId"
              :show-context-link="showContextLink"
              :show-channel="showChannel"
              :original-poster="originalPoster"
            />
            <div
              class="ml-3 flex-grow border-l border-gray-300 pl-4 dark:border-gray-500"
            >
              <div v-if="!themeLoading" class="w-full dark:text-gray-200">
                <div class="w-full overflow-auto">
                  <div
                    v-if="
                      commentData.text &&
                      editFormOpenAtCommentID !== commentData.id
                    "
                    class="-ml-2"
                    :class="[goToPermalinkOnClick ? 'cursor-pointer' : '']"
                  >
                    <MarkdownPreview
                      :key="textCopy || ''"
                      :text="textCopy || ''"
                      :word-limit="1000"
                      :disable-gallery="goToPermalinkOnClick"
                      @click="
                        () => {
                          if (goToPermalinkOnClick) {
                            router.push(permalinkObject);
                          }
                        }
                      "
                    />
                  </div>
                  <TextEditor
                    v-if="
                      !readonly && editFormOpenAtCommentID === commentData.id
                    "
                    id="editExistingComment"
                    class="mb-2 mt-3 p-1"
                    :initial-value="commentData.text || ''"
                    :editor-id="editorId"
                    @update="updateExistingComment($event, depth)"
                  />
                  <ErrorBanner
                    v-if="
                      editCommentError &&
                      !readonly &&
                      editFormOpenAtCommentID === commentData.id
                    "
                    :text="editCommentError && editCommentError.message"
                  />
                </div>
                <div class="flex items-center">
                  <CommentButtons
                    v-if="channelId && showCommentButtons"
                    class="mb-1 ml-1"
                    :class="[
                      editFormOpenAtCommentID === commentData.id ? 'ml-1' : '',
                    ]"
                    :comment-data="commentData"
                    :enable-feedback="enableFeedback"
                    :depth="depth"
                    :locked="locked"
                    :parent-comment-id="parentCommentId"
                    :show-edit-comment-field="
                      editFormOpenAtCommentID === commentData.id
                    "
                    :show-replies="showReplies"
                    :reply-form-open-at-comment-i-d="replyFormOpenAtCommentID"
                    :comment-in-process="commentInProcess && !editCommentError"
                    @startCommentSave="$emit('startCommentSave')"
                    @clickEditComment="handleEdit"
                    @createComment="createComment"
                    @openReplyEditor="$emit('openReplyEditor', commentData.id)"
                    @hideReplyEditor="$emit('hideReplyEditor')"
                    @openEditCommentEditor="
                      $emit('openEditCommentEditor', commentData.id)
                    "
                    @hideEditCommentEditor="$emit('hideEditCommentEditor')"
                    @hideReplies="showReplies = false"
                    @openModProfile="$emit('openModProfile')"
                    @saveEdit="$emit('saveEdit')"
                    @showReplies="showReplies = true"
                    @updateNewComment="updateNewComment"
                    @clickFeedback="
                      () => {
                        // This event is emitted when the user clicks a menu item from the thumbs-down.
                        // Passing the commentData in at the template instead of the setup
                        // function or methods is better because it allows us to specify that
                        // we want a nested comment to be the target. If we did it in methods
                        // or setup, feedback would end up attached to the parent
                        // instead of the child (because the event is emitted by both child and parent,
                        // because this is a recursively nested component).
                        handleFeedback({
                          commentData,
                          parentCommentId,
                        });
                      }
                    "
                    @handleViewFeedback="
                      $emit('handleViewFeedback', commentData.id)
                    "
                    @clickUndoFeedback="
                      () => {
                        // See comment on clickFeedback. The same principle applies.
                        handleUndoFeedback({
                          commentData,
                          parentCommentId,
                        });
                      }
                    "
                    @clickEditFeedback="
                      () => {
                        // See comment on clickFeedback. The same principle applies.
                        handleEditFeedback({
                          commentData,
                        });
                      }
                    "
                  >
                    <MenuButton
                      v-if="commentMenuItems.length > 0"
                      id="commentMenu"
                      :items="commentMenuItems"
                      @copyLink="copyLink"
                      @handleEdit="() => handleEdit(commentData)"
                      @clickReport="handleReport"
                      @clickFeedback="
                        () => {
                          // This event is emitted when the user clicks give feedback in the comment menu.
                          // Passing the commentData in at the template instead of the setup
                          // function or methods is better because it allows us to specify that
                          // we want a nested comment to be the target. If we did it in methods
                          // or setup, feedback would end up attached to the parent
                          // instead of the child.
                          handleFeedback({
                            commentData,
                            parentCommentId,
                          });
                        }
                      "
                      @clickUndoFeedback="
                        () => {
                          // See comment on clickFeedback. The same principle applies.
                          handleUndoFeedback({ commentData, parentCommentId });
                        }
                      "
                      @handleViewFeedback="
                        $emit('handleViewFeedback', commentData.id)
                      "
                      @handleDelete="
                        () => {
                          const deleteCommentInput = {
                            commentId: commentData.id,
                            parentCommentId,
                            replyCount,
                          };
                          handleDelete(deleteCommentInput);
                        }
                      "
                      @clickEditFeedback="
                        () => {
                          // See comment on clickFeedback. The same principle applies.
                          handleEditFeedback({
                            commentData,
                          });
                        }
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
            canShowPermalink && replyCount > 0 && depth + 1 > maxCommentDepth
          "
          class="flex w-full cursor-pointer items-center gap-1 border-gray-300 pl-4 text-gray-400 underline dark:border-gray-500 dark:text-gray-300"
          :to="permalinkObject"
          @click.prevent="$emit('scrollToTop')"
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
            :parent-comment-id="commentData.id"
            :mod-name="modProfileName"
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
                :depth="depth + 1"
                :locked="locked"
                :parent-comment-id="commentData.id"
                :comment-in-process="commentInProcess"
                :edit-form-open-at-comment-i-d="editFormOpenAtCommentID"
                :reply-form-open-at-comment-i-d="replyFormOpenAtCommentID"
                :mod-profile-name="modProfileName"
                :original-poster="originalPoster"
                @startCommentSave="$emit('startCommentSave')"
                @clickEditComment="$emit('clickEditComment', $event)"
                @deleteComment="handleDelete"
                @createComment="$emit('createComment')"
                @saveEdit="$emit('saveEdit')"
                @updateCreateReplyCommentInput="updateNewComment"
                @updateEditCommentInput="updateExistingComment"
                @showCopiedLinkNotification="
                  $emit('showCopiedLinkNotification', $event)
                "
                @openModProfile="$emit('openModProfile')"
                @scrollToTop="$emit('scrollToTop')"
                @openReplyEditor="
                  ($event: string) => $emit('openReplyEditor', $event)
                "
                @hideReplyEditor="$emit('hideReplyEditor')"
                @openEditCommentEditor="
                  $emit('openEditCommentEditor', childComment.id)
                "
                @hideEditCommentEditor="$emit('hideEditCommentEditor')"
                @clickFeedback="handleFeedback"
                @clickUndoFeedback="handleUndoFeedback"
                @handleViewFeedback="
                  (commentId: string) => {
                    $emit('handleViewFeedback', commentId);
                  }
                "
              />
            </div>
          </ChildComments>
        </div>
      </div>
    </div>
  </div>
</template>

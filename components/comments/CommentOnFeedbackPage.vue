<script lang="ts">
import type { PropType } from "vue";
import { defineComponent, computed, ref  } from "vue";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { GET_LOCAL_MOD_PROFILE_NAME } from "@/graphQLData/user/queries";
import MenuButton, { ALLOWED_ICONS } from "../buttons/MenuButton.vue";
import useClipboard from "vue-clipboard3";
import VoteButtons from "./VoteButtons.vue";
import EllipsisHorizontal from "../icons/EllipsisHorizontal.vue";
import { DELETE_COMMENT , UPDATE_COMMENT } from "@/graphQLData/comment/mutations";
import type { HandleEditFeedbackInput, HandleFeedbackInput } from "./Comment.vue";
import { useRoute, useRouter } from "vue-router";
import type { Comment } from "@/src/__generated__/graphql";
import MarkdownPreview from "../MarkdownPreview.vue";
import TextEditor from "../forms/TextEditor.vue";
import CancelButton from "@/components/CancelButton.vue";
import SaveButton from "@/components/SaveButton.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import WarningModal from "@/components/WarningModal.vue";

export default defineComponent({
  name: "CommentOnFeedbackPage",
  components: {
    CancelButton,
    EllipsisHorizontal,
    ErrorBanner,
    MarkdownPreview,
    MenuButton,
    SaveButton,
    TextEditor,
    VoteButtons,
    WarningModal,
  },
  props: {
    comment: {
      type: Object as PropType<Comment>,
      required: true,
    },
    isHighlighted: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const { toClipboard } = useClipboard();

    const {
      result: localModProfileNameResult,
      loading: localModProfileNameLoading,
      error: localModProfileNameError,
    } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

    const updateCommentInput = ref({
      text: props.comment.text,
    });

    const {
      loading: editCommentLoading,
      mutate: editComment,
      error: editCommentError,
      onDone: onDoneUpdatingComment,
    } = useMutation(UPDATE_COMMENT, () => ({
      variables: {
        commentWhere: {
          id: props.comment.id,
        },
        updateCommentInput: updateCommentInput.value,
      },
    }));

    const {
      loading: deleteCommentLoading,
      error: deleteCommentError,
      mutate: deleteComment,
      onDone: onDoneDeletingComment,
    } = useMutation(DELETE_COMMENT, {
      update: (cache: any) => {
        // Evict the comment from the cache.
        cache.evict({
          id: cache.identify({ __typename: "Comment", id: props.comment.id }),
        });
      },
    });

    const loggedInModName = computed(() => {
      if (localModProfileNameLoading.value || localModProfileNameError.value) {
        console.error("Error fetching mod profile name");
        return "";
      }
      return localModProfileNameResult.value.modProfileName;
    });

    const commentMenuItems = computed(() => {
      let out: any[] = [];

      out = out.concat([
        {
          label: "View Feedback",
          value: "",
          event: "handleViewFeedback",
          icon: ALLOWED_ICONS.VIEW_FEEDBACK,
        },
      ]);
      const loggedInUserAuthoredComment =
        props.comment?.CommentAuthor?.displayName === loggedInModName.value;

      if (loggedInUserAuthoredComment) {
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
      } else if (loggedInModName.value) {
        out = out.concat([
          {
            label: "Report",
            value: "",
            event: "clickReport",
            icon: ALLOWED_ICONS.REPORT,
          },
        ]);

        if (props.comment.FeedbackCommentsAggregate?.count === 0) {
          if (!loggedInUserAuthoredComment)
            out.push({
              label: "Give Feedback",
              value: "",
              event: "clickFeedback",
              icon: ALLOWED_ICONS.GIVE_FEEDBACK,
            });
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

      out.push({
        label: "Copy Link",
        value: "",
        event: "copyLink",
        icon: ALLOWED_ICONS.COPY_LINK,
      });

      return out;
    });
    const route = useRoute();
    const router = useRouter();

    const getPermalinkObject = () => {
      const { discussionId, channelId, commentId } = route.params;

      return {
        name: "DiscussionCommentFeedbackPermalink",
        params: {
          discussionId,
          commentId,
          channelId,
          feedbackId: props.comment.id,
        },
      };
    };

    const copyLink = async () => {
      const basePath = window.location.origin;
      const permalinkObject = getPermalinkObject();
      const permalink = `${basePath}${router.resolve(permalinkObject).href}`;
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

    const showDeleteCommentModal = ref(false);
    onDoneDeletingComment(() => {
      showDeleteCommentModal.value = false;
    });

    const editCommentMode = ref(false);
    onDoneUpdatingComment(() => {
      editCommentMode.value = false;
    });

    return {
      commentMenuItems,
      copyLink,
      editComment,
      editCommentError,
      editCommentLoading,
      editCommentMode,
      deleteComment,
      deleteCommentError,
      deleteCommentLoading,
      loggedInModName,
      router,
      timeAgo,
      updateCommentInput,
      showDeleteCommentModal,
    };
  },
  methods: {
    handleDeleteComment() {
      // Hard delete the comment if there are no replies
      // to avoid cluttering the screen
      this.deleteComment({ id: this.comment.id });
    },
    handleEdit() {
      this.editCommentMode = true;
    },
    handleSaveEditComment() {
      this.editComment(this.updateCommentInput);
    },
    updateExistingComment(text: string, depth: number) {
      this.$emit("updateEditCommentInput", text, depth === 1);
    },
    updateText(text: string) {
      this.updateCommentInput.text = text;
    },
    handleReport() {
      this.$emit("clickReport", this.comment);
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
    handleViewFeedback(feedbackId: string) {
      this.router.push({
        name: "FeedbackOnCommentFeedback",
        params: {
          channelId: this.channelId,
          discussionId: this.discussionId,
          commentId: feedbackId,
        },
      });
    },
  },
});
</script>
<template>
  <div>
    <div
      class="flex flex-wrap items-center gap-x-1 text-sm leading-8 text-gray-500 dark:text-gray-300"
    >
      <Avatar
        v-if="comment.CommentAuthor?.displayName"
        class="mr-1 h-36 w-36 border-2 shadow-sm dark:border-gray-800"
        :text="comment.CommentAuthor.displayName"
        :is-small="true"
        :is-square="false"
      />
      <span class="mr-0.5">
        <router-link
          v-if="comment.CommentAuthor?.displayName"
          :to="{
            name: 'ModProfile',
            params: {
              modId: comment.CommentAuthor.displayName,
            },
          }"
          class="font-medium text-gray-900 hover:underline dark:text-gray-200"
        >
          {{ comment.CommentAuthor?.displayName }}
        </router-link>
        <span v-else>[Deleted User]</span>
      </span>
      <span v-if="loggedInModName === comment?.CommentAuthor?.displayName">
        (You)
      </span>
      <span class="whitespace-nowrap">{{
        `gave feedback ${timeAgo(new Date(comment.createdAt))}`
      }}</span>
      <span
        v-if="isHighlighted"
        class="rounded-lg bg-blue-500 px-2 text-black"
      >Permalinked
      </span>
      <MenuButton
        v-if="commentMenuItems.length > 0"
        id="commentMenu"
        class="flex items-center"
        :items="commentMenuItems"
        @copy-link="copyLink"
        @handle-edit="() => handleEdit()"
        @click-report="handleReport"
        @click-feedback="
          () => {
            // This event is emitted when the user clicks give feedback in the comment menu.
            // Passing the comment in at the template instead of the setup
            // function or methods is better because it allows us to specify that
            // we want a nested comment to be the target. If we did it in methods
            // or setup, feedback would end up attached to the parent
            // instead of the child.
            handleFeedback({
              commentData: comment,
              parentCommentId: '',
            });
          }
        "
        @click-undo-feedback="
          () => {
            // See comment on clickFeedback. The same principle applies.
            handleUndoFeedback({ commentData: comment, parentCommentId: '' });
          }
        "
        @handle-view-feedback="() => handleViewFeedback(comment.id)"
        @handle-delete="
          () => {
            showDeleteCommentModal = true;
          }
        "
        @click-edit-feedback="
          () => {
            // See comment on clickFeedback. The same principle applies.
            handleEditFeedback({
              commentData: comment,
            });
          }
        "
      >
        <EllipsisHorizontal
          class="h-5 w-5 cursor-pointer hover:text-black dark:text-gray-300 dark:hover:text-white"
        />
      </MenuButton>
    </div>

    <div class="ml-12 border-l-2 border-gray-200 pl-2 dark:border-gray-500">
      <MarkdownPreview
        v-if="comment.text && !editCommentMode"
        class=""
        :text="comment.text"
        :disable-gallery="true"
      />
      <div v-else-if="editCommentMode">
        <TextEditor
          :initial-value="comment.text || ''"
          :depth="1"
          :allow-image-upload="false"
          @update="updateText"
        />
        <ErrorBanner
          v-if="editCommentError"
          class="mt-2 px-4"
          :text="editCommentError.message"
        />
        <div class="ml-1 mt-3 flex justify-start">
          <CancelButton @click="editCommentMode = false" />
          <SaveButton
            data-testid="saveCommentButton"
            :disabled="comment.text === updateCommentInput.text"
            :loading="editCommentLoading && !editCommentError"
            @click.prevent="handleSaveEditComment"
          />
        </div>
      </div>
      <VoteButtons
        class="ml-3"
        :comment-data="comment"
        :show-downvote="comment.CommentAuthor?.displayName !== loggedInModName"
        :show-upvote="false"
        @open-mod-profile="$emit('openModProfile')"
        @click-feedback="
          () => {
            handleFeedback({
              commentData: comment,
              parentCommentId: '',
            });
          }
        "
        @click-undo-feedback="
          () => {
            // See comment on clickFeedback. The same principle applies.
            handleUndoFeedback({ commentData: comment, parentCommentId: '' });
          }
        "
        @click-edit-feedback="$emit('clickEditFeedback')"
        @view-feedback="() => handleViewFeedback(comment.id)"
      />
    </div>
    <WarningModal
      :title="'Delete Comment'"
      :body="'Are you sure you want to delete this comment?'"
      :open="showDeleteCommentModal"
      :loading="deleteCommentLoading"
      :error="deleteCommentError"
      @close="showDeleteCommentModal = false"
      @primary-button-click="handleDeleteComment"
    />
  </div>
</template>

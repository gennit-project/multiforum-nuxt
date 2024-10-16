<script setup lang="ts">
import { ref, computed } from "vue";
import { useMutation } from "@vue/apollo-composable";
import { useRoute, useRouter } from "vue-router";
import {
  DELETE_COMMENT,
  UPDATE_COMMENT,
} from "@/graphQLData/comment/mutations";
import VoteButtons from "./VoteButtons.vue";
import EllipsisHorizontal from "@/components/icons/EllipsisHorizontal.vue";
import MarkdownPreview from "../MarkdownPreview.vue";
import TextEditor from "../TextEditor.vue";
import CancelButton from "@/components/CancelButton.vue";
import SaveButton from "@/components/SaveButton.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import WarningModal from "@/components/WarningModal.vue";
import type { PropType } from "vue";
import type { Comment } from "@/__generated__/graphql";
import type {
  HandleEditFeedbackInput,
  HandleFeedbackInput,
} from "./Comment.vue";
import { timeAgo, ALLOWED_ICONS } from "@/utils";
import { modProfileNameVar } from "@/cache";

const props = defineProps({
  comment: {
    type: Object as PropType<Comment>,
    required: true,
  },
  isHighlighted: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "showCopiedLinkNotification",
  "clickReport",
  "clickFeedback",
  "clickUndoFeedback",
  "clickEditFeedback",
  "handleViewFeedback",
  "openModProfile",
]);
const route = useRoute();
const router = useRouter();


const loggedInModName = computed(() => {
  const modName = modProfileNameVar();
  if (!modName) {
    console.error("Error fetching mod profile name")
  }
  return modName;
});

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
    cache.evict({
      id: cache.identify({ __typename: "Comment", id: props.comment.id }),
    });
  },
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

const getPermalinkObject = () => {
  const { discussionId, channelId } = route.params;

  return {
    name: "forums-forumId-discussions-feedback-discussionId-feedbackPermalink-feedbackId",
    params: {
      discussionId,
      forumId: channelId,
      feedbackId: props.comment.id,
    },
  };
};

const copyLink = async () => {
  let basePath = "";
  if (import.meta.client) {
    basePath = window.location.origin;
  } else {
    basePath = process.env.BASE_URL || "";
  }
  const permalinkObject = getPermalinkObject();
  const permalink = `${basePath}${router.resolve(permalinkObject).href}`;
  try {
    await navigator.clipboard.writeText(permalink);
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

function handleDeleteComment() {
  deleteComment({ id: props.comment.id });
}

function handleEdit() {
  editCommentMode.value = true;
}

function handleSaveEditComment() {
  editComment();
}

function updateText(text: string) {
  updateCommentInput.value.text = text;
}

function handleReport() {
  emit("clickReport", props.comment);
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

function handleViewFeedback(feedbackId: string) {
  router.push({
    name: 'forums-forumId-discussions-discussionId-commentFeedback-commentId',
    params: {
      forumId: route.params.forumId,
      discussionId: route.params.discussionId,
      commentId: feedbackId,
    },
  });
}
</script>

<template>
  <div>
    <div
      class="flex flex-wrap items-center gap-x-1 text-sm text-gray-500 dark:text-gray-300"
    >
      <AvatarComponent
        v-if="comment.CommentAuthor?.displayName"
        class="mr-1 shadow-sm dark:border-gray-800"
        :text="comment.CommentAuthor.displayName"
        :is-small="true"
        :is-square="false"
      />
      <span class="mr-0.5">
        <nuxt-link
          v-if="comment.CommentAuthor?.displayName"
          :to="{
            name: 'mod-modId',
            params: {
              modId: comment.CommentAuthor.displayName,
            },
          }"
          class="font-medium text-gray-900 hover:underline dark:text-gray-200"
        >
          {{ comment.CommentAuthor?.displayName }}
        </nuxt-link>
        <span v-else>[Deleted User]</span>
      </span>
      <span v-if="loggedInModName === comment?.CommentAuthor?.displayName">
        (You)
      </span>
      <span class="whitespace-nowrap">{{
        `gave feedback ${timeAgo(new Date(comment.createdAt))}`
      }}</span>
      <span v-if="isHighlighted" class="rounded-lg bg-blue-500 px-2 text-black"
        >Permalinked</span
      >
      <MenuButton
        v-if="commentMenuItems.length > 0"
        id="commentMenu"
        class="flex items-center"
        :items="commentMenuItems"
        @copy-link="copyLink"
        @handle-edit="handleEdit"
        @click-report="handleReport"
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
            handleUndoFeedback({ commentData: comment, parentCommentId: '' });
          }
        "
        @handle-view-feedback="handleViewFeedback(comment.id)"
        @handle-delete="
          () => {
            showDeleteCommentModal = true;
          }
        "
        @click-edit-feedback="
          () => {
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
            handleUndoFeedback({ commentData: comment, parentCommentId: '' });
          }
        "
        @click-edit-feedback="$emit('clickEditFeedback')"
        @view-feedback="handleViewFeedback(comment.id)"
      />
    </div>
    <WarningModal
      :title="'Delete Comment'"
      :body="'Are you sure you want to delete this comment?'"
      :open="showDeleteCommentModal"
      :loading="deleteCommentLoading"
      :error="deleteCommentError"
      @close="
        () => {
          showDeleteCommentModal = false;
        }
      "
      @primary-button-click="handleDeleteComment"
    />
  </div>
</template>

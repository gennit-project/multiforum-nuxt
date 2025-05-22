<script setup lang="ts">
  import { ref, computed } from "vue";
  import { useMutation } from "@vue/apollo-composable";
  import { useRoute, useRouter } from "nuxt/app";
  import { DELETE_COMMENT, UPDATE_COMMENT } from "@/graphQLData/comment/mutations";
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
  import { timeAgo, ALLOWED_ICONS } from "@/utils";
  import { modProfileNameVar, usernameVar } from "@/cache";
  import { getFeedbackPermalinkObject } from "@/utils/routerUtils";
  import ArchivedCommentText from "@/components/comments/ArchivedCommentText.vue";
  import BrokenRulesModal from "@/components/mod/BrokenRulesModal.vue";
  import Notification from "@/components/NotificationComponent.vue";
  import UnarchiveModal from "@/components/mod/UnarchiveModal.vue";

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
    "openModProfile",
    "clickArchive",
    "clickUnarchive",
    "clickArchiveAndSuspend",
  ]);
  const route = useRoute();
  const router = useRouter();

  const loggedInModName = computed(() => {
    const modName = modProfileNameVar.value;
    if (!modName) {
      console.error("Error fetching mod profile name");
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

  const { discussionId, eventId, forumId } = route.params;

  const commentMenuItems = computed(() => {
    let out: any[] = [];
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
    } else if (usernameVar.value) {
      if (loggedInModName.value) {
        out = out.concat([
          {
            label: "Report",
            value: "",
            event: "clickReport",
            icon: ALLOWED_ICONS.REPORT,
          },
        ]);
        // Only add these if mod permissions are elevated
        if (!props.comment.archived) {
          out = out.concat([
            {
              label: "Archive",
              event: "clickArchive",
              icon: ALLOWED_ICONS.ARCHIVE,
              value: "",
            },
            {
              label: "Archive and Suspend",
              event: "clickArchiveAndSuspend",
              icon: ALLOWED_ICONS.SUSPEND,
              value: "",
            },
          ]);
        } else {
          out = out.concat([
            {
              label: "Unarchive",
              event: "clickUnarchive",
              icon: ALLOWED_ICONS.UNARCHIVE,
              value: "",
            },
          ]);
        }
      } else {
        out = out.concat([
          {
            label: "Report",
            value: "",
            event: "clickReport",
            icon: ALLOWED_ICONS.REPORT,
          },
        ]);
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

  const copyLink = async () => {
    let basePath = "";
    if (import.meta.client) {
      basePath = window.location.origin;
    } else {
      basePath = process.env.BASE_URL || "";
    }

    const permalinkObject = getFeedbackPermalinkObject({
      routeName: route.name as string,
      forumId: forumId as string,
      discussionId: discussionId as string,
      eventId: eventId as string,
      commentId: props.comment.id,
      GivesFeedbackOnComment: props.comment.GivesFeedbackOnComment || undefined,
      GivesFeedbackOnDiscussion: props.comment.GivesFeedbackOnDiscussion || undefined,
      GivesFeedbackOnEvent: props.comment.GivesFeedbackOnEvent || undefined,
    });
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

  const showBrokenRulesModal = ref(false);
  const showSuccessfullyReported = ref(false);
  const showArchiveModal = ref(false);
  const showSuccessfullyArchived = ref(false);
  const showArchiveAndSuspendModal = ref(false);
  const showSuccessfullyArchivedAndSuspended = ref(false);

  function handleReport() {
    showBrokenRulesModal.value = true;
  }

  function handleArchive() {
    showArchiveModal.value = true;
  }

  function handleArchiveAndSuspend() {
    showArchiveAndSuspendModal.value = true;
  }

  const showUnarchiveModal = ref(false);
  const showSuccessfullyUnarchived = ref(false);

  function handleUnarchive() {
    showUnarchiveModal.value = true;
  }
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-x-1 text-sm text-gray-500 dark:text-gray-300">
      <AvatarComponent
        v-if="comment.CommentAuthor?.displayName"
        class="mr-1 shadow-sm dark:border-gray-300"
        :is-small="true"
        :is-square="false"
        :text="comment.CommentAuthor.displayName"
      />
      <span class="mr-0.5">
        <nuxt-link
          v-if="comment.CommentAuthor?.displayName"
          class="font-medium text-gray-900 hover:underline dark:text-gray-200"
          :to="{
            name: 'mod-modId',
            params: {
              modId: comment.CommentAuthor.displayName,
            },
          }"
        >
          {{ comment.CommentAuthor?.displayName }}
        </nuxt-link>
        <span v-else>[Deleted User]</span>
      </span>
      <span v-if="loggedInModName === comment?.CommentAuthor?.displayName"> (You) </span>
      <span class="whitespace-nowrap">{{
        `gave feedback ${timeAgo(new Date(comment.createdAt))}`
      }}</span>
      <span
        v-if="isHighlighted"
        class="bg-orange-500 rounded-lg px-2 text-black"
        >Permalinked</span
      >
      <MenuButton
        v-if="commentMenuItems.length > 0"
        id="commentMenu"
        class="flex items-center"
        :data-testid="'feedback-comment-menu'"
        :items="commentMenuItems"
        @click-archive="handleArchive"
        @click-archive-and-suspend="handleArchiveAndSuspend"
        @click-report="handleReport"
        @click-unarchive="handleUnarchive"
        @copy-link="copyLink"
        @handle-delete="
          () => {
            showDeleteCommentModal = true;
          }
        "
        @handle-edit="handleEdit"
      >
        <EllipsisHorizontal
          class="h-5 w-5 cursor-pointer hover:text-black dark:text-gray-300 dark:hover:text-white"
        />
      </MenuButton>
    </div>

    <div class="ml-12 border-l-2 border-gray-300 pl-2 dark:border-gray-300">
      <ArchivedCommentText
        v-if="comment?.archived"
        :channel-id="forumId as string"
        :comment-id="comment.id"
      />
      <MarkdownPreview
        v-else-if="comment.text && !editCommentMode"
        :disable-gallery="true"
        :text="comment.text"
      />
      <div v-else-if="editCommentMode">
        <TextEditor
          :allow-image-upload="false"
          :depth="1"
          :initial-value="comment.text || ''"
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
        :show-downvote="false"
        :show-upvote="false"
        @open-mod-profile="$emit('openModProfile')"
      />
    </div>
    <WarningModal
      :body="'Are you sure you want to delete this comment?'"
      :data-testid="'delete-comment-modal'"
      :error="deleteCommentError?.message"
      :loading="deleteCommentLoading"
      :open="showDeleteCommentModal"
      :title="'Delete Comment'"
      @close="
        () => {
          showDeleteCommentModal = false;
        }
      "
      @primary-button-click="handleDeleteComment"
    />
    <BrokenRulesModal
      v-if="showBrokenRulesModal"
      :channel-unique-name="forumId as string"
      :comment="comment"
      :comment-id="comment.id"
      :open="showBrokenRulesModal"
      @close="showBrokenRulesModal = false"
      @report-submitted-successfully="
        () => {
          showSuccessfullyReported = true;
          showBrokenRulesModal = false;
        }
      "
    />
    <BrokenRulesModal
      v-if="showArchiveModal"
      :archive-after-reporting="true"
      :comment-id="comment.id"
      :open="showArchiveModal"
      @close="showArchiveModal = false"
      @reported-and-archived-successfully="
        () => {
          showSuccessfullyArchived = true;
          showArchiveModal = false;
        }
      "
    />
    <BrokenRulesModal
      v-if="showArchiveAndSuspendModal"
      :comment-id="comment.id"
      :open="showArchiveAndSuspendModal"
      :suspend-user-enabled="true"
      :text-box-label="'(Optional) Explain why you are suspending this author:'"
      :title="'Suspend Author'"
      @close="showArchiveAndSuspendModal = false"
      @suspended-user-successfully="
        () => {
          showSuccessfullyArchivedAndSuspended = true;
          showArchiveAndSuspendModal = false;
        }
      "
    />
    <UnarchiveModal
      v-if="showUnarchiveModal"
      :comment-id="comment.id"
      :open="showUnarchiveModal"
      @close="showUnarchiveModal = false"
      @unarchived-successfully="
        () => {
          showSuccessfullyUnarchived = true;
          showUnarchiveModal = false;
        }
      "
    />
    <Notification
      :show="showSuccessfullyReported"
      :title="'Your report was submitted successfully.'"
      @close-notification="showSuccessfullyReported = false"
    />
    <Notification
      :show="showSuccessfullyArchived"
      :title="'The content was reported and archived successfully.'"
      @close-notification="showSuccessfullyArchived = false"
    />
    <Notification
      :show="showSuccessfullyArchivedAndSuspended"
      :title="'Archived the post and suspended the author.'"
      @close-notification="showSuccessfullyArchivedAndSuspended = false"
    />
    <Notification
      :show="showSuccessfullyUnarchived"
      :title="'The content was unarchived successfully.'"
      @close-notification="showSuccessfullyUnarchived = false"
    />
  </div>
</template>

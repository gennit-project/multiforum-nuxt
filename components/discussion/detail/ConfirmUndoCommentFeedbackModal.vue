<script lang="ts" setup>
import { ref, computed } from "vue";
import type { PropType } from "vue";
import { useQuery, useMutation } from "@vue/apollo-composable";
import GenericModal from "@/components/GenericModal.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { DELETE_COMMENT } from "@/graphQLData/comment/mutations";
import { GET_SPECIFIC_COMMENT_FEEDBACK as GET_FEEDBACK } from "@/graphQLData/comment/queries";
import type { Comment } from "@/__generated__/graphql";
import CommentHeader from "@/components/comments/CommentHeader.vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";

const props = defineProps({
  commentId: {
    type: String,
    required: true,
  },
  commentToRemoveFeedbackFrom: {
    type: Object as PropType<Comment>,
    required: true,
  },
  modName: {
    type: String,
    required: true,
  },
  open: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "updateFeedback"]);

const feedbackToDeleteID = ref("");
const commentData = ref<Comment | null>(null);

const { error: getError, onResult } = useQuery(GET_FEEDBACK, {
  commentId: props.commentId,
  modName: props.modName,
}, {
  fetchPolicy: "network-only",
});

onResult((result) => {
  const comment = result?.data?.comments?.[0];
  if (!comment) {
    console.warn("No feedback found");
    return;
  }
  feedbackToDeleteID.value = comment.id;
  commentData.value = comment;
});

const { mutate: deleteFeedback, loading: deleteLoading, error: deleteError, onDone: onFeedbackDeleted } = useMutation(DELETE_COMMENT, {
  update: (cache, { data }) => {
    if (commentData.value && data?.deleteComments?.nodesDeleted > 0) {
      cache.evict({ id: cache.identify(commentData.value) });
    }
  },
});

onFeedbackDeleted(() => {
  emit("close");
});

function handleDelete() {
  try {
    deleteFeedback({ id: feedbackToDeleteID.value });
  } catch (error) {
    console.error("Error deleting feedback", error);
  }
}

const title = computed(() => "Delete your feedback?");
const body = computed(() => "Are you sure you want to delete your feedback?");

</script>

<template>
  <GenericModal
    :highlight-color="'red'"
    :title="title"
    :body="body"
    :open="open"
    :loading="deleteLoading"
    :primary-button-text="'Delete'"
    :secondary-button-text="'Cancel'"
    @primary-button-click="handleDelete"
    @secondary-button-click="$emit('close')"
  >
    <template #icon>
      <i class="fas fa-trash-alt dark:text-white" />
    </template>
    <template #content>
      <CommentHeader
        v-if="commentData"
        :comment-data="commentData"
        :is-highlighted="false"
        :show-context-link="true"
        :show-channel="false"
      />
      <div
        v-if="commentData"
        class="ml-2 flex flex-col gap-2 border-l pl-4"
      >
        <MarkdownPreview
          class="dark:text-white"
          :text="commentData?.text || '[Deleted]'"
          :disable-gallery="true"
        />
      </div>
      <ErrorBanner
        v-if="getError"
        :text="getError.message"
      />
      <ErrorBanner
        v-if="deleteError"
        :text="deleteError.message"
      />
    </template>
  </GenericModal>
</template>

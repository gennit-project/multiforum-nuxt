<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import GenericModal from '@/components/GenericModal.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import { GET_SPECIFIC_COMMENT_FEEDBACK as GET_FEEDBACK } from '@/graphQLData/comment/queries';
import CommentHeader from '@/components/comments/CommentHeader.vue';
import TextEditor from '@/components/TextEditor.vue';
import { UPDATE_COMMENT } from '@/graphQLData/comment/mutations';
import PencilIcon from '@/components/icons/PencilIcon.vue';
import type { Ref } from 'vue';
import type { Comment } from '@/__generated__/graphql';
import type { CreateEditCommentFormValues } from '@/types/Comment';

const props = defineProps({
  commentId: {
    type: String,
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

const emit = defineEmits(['close']);

const feedbackToEditID = ref('');
const commentData: Ref<Comment | null> = ref(null);

const {
  error: getError,
  onResult,
} = useQuery(
  GET_FEEDBACK,
  {
    commentId: props.commentId,
    modName: props.modName,
  },
  {
    fetchPolicy: 'network-only',
  }
);

const editFormValues = ref<CreateEditCommentFormValues>({
  text: commentData.value?.text || '',
  isRootComment: true,
  depth: 1,
});

const updateCommentInput = computed(() => ({
  text: editFormValues.value?.text || '',
}));

onResult((result) => {
  const comment = result?.data?.comments?.[0];
  if (!comment) {
    console.warn('No feedback found');
    return;
  }
  feedbackToEditID.value = comment.id;
  commentData.value = comment;
  editFormValues.value.text = comment.text;
});

const {
  mutate: editComment,
  loading: editLoading,
  error: editCommentError,
  onDone: onDoneUpdatingComment,
} = useMutation(UPDATE_COMMENT, () => ({
  variables: {
    commentWhere: {
      id: commentData.value?.id || '',
    },
    updateCommentInput: updateCommentInput.value,
  },
}));

onDoneUpdatingComment(() => {
  emit('close');
});

const handleEdit = () => {
  try {
    editComment();
  } catch (error) {
    console.error('Error updating feedback', error);
  }
};

const updateFeedback = (text: string) => {
  editFormValues.value.text = text;
};

const title = 'Edit your feedback';
const body = '';

</script>

<template>
  <GenericModal
    :highlight-color="'red'"
    :title="title"
    :body="body"
    :open="open"
    :loading="editLoading"
    :primary-button-text="'Update'"
    :secondary-button-text="'Cancel'"
    @primary-button-click="handleEdit"
    @close="$emit('close')"
    @secondary-button-click="$emit('close')"
  >
    <template #icon>
      <PencilIcon class="h-6 w-6" />
    </template>
    <template #content>
      <CommentHeader
        v-if="commentData"
        :comment-data="commentData"
        :is-highlighted="false"
        :show-context-link="true"
        :show-channel="false"
      />
      <div class="ml-2 flex flex-col gap-2 border-l pl-4">
        <TextEditor
          id="editFeedbackComment"
          :key="commentData?.id"
          class="mb-2 mt-3 p-1"
          :initial-value="commentData?.text || '[Deleted]'"
          @update="updateFeedback"
        />
      </div>
      <ErrorBanner v-if="getError" :text="getError.message" />
      <ErrorBanner v-if="editCommentError" :text="editCommentError.message" />
    </template>
  </GenericModal>
</template>

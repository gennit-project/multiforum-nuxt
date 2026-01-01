<script lang="ts" setup>
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { ADD_FEEDBACK_COMMENT_TO_DISCUSSION } from '@/graphQLData/discussion/mutations';
import type { DiscussionChannel } from '@/__generated__/graphql';
import GenericFeedbackFormModal from '@/components/GenericFeedbackFormModal.vue';
import ConfirmUndoDiscussionFeedbackModal from '@/components/discussion/detail/ConfirmUndoDiscussionFeedbackModal.vue';
import EditFeedbackModal from '@/components/discussion/detail/EditFeedbackModal.vue';
import Notification from '@/components/NotificationComponent.vue';

const props = defineProps({
  discussionId: {
    type: String,
    required: true,
  },
  loggedInUserModName: {
    type: String,
    default: '',
  },
  activeDiscussionChannel: {
    type: Object as () => DiscussionChannel | null,
    default: null,
  },
});

const emit = defineEmits<{
  feedbackSubmitted: [];
}>();

const {
  mutate: addFeedbackCommentToDiscussion,
  error: addFeedbackCommentToDiscussionError,
  loading: addFeedbackCommentToDiscussionLoading,
  onDone: onAddFeedbackCommentToDiscussionDone,
} = useMutation(ADD_FEEDBACK_COMMENT_TO_DISCUSSION);

const showFeedbackFormModal = ref(false);
const showEditFeedbackModal = ref(false);
const showConfirmUndoFeedbackModal = ref(false);
const showFeedbackSubmittedSuccessfully = ref(false);
const feedbackText = ref('');

onAddFeedbackCommentToDiscussionDone(() => {
  showFeedbackFormModal.value = false;
  showFeedbackSubmittedSuccessfully.value = true;
  emit('feedbackSubmitted');
});

const handleClickGiveFeedback = () => {
  showFeedbackFormModal.value = true;
};

const handleSubmitFeedback = async () => {
  if (!feedbackText.value) {
    console.error('No feedback text found.');
    return;
  }
  if (!props.loggedInUserModName) {
    console.error('No mod name found.');
    return;
  }
  if (!props.activeDiscussionChannel?.channelUniqueName) {
    console.error('No active discussion channel found.');
    return;
  }
  await addFeedbackCommentToDiscussion({
    discussionId: props.discussionId,
    text: feedbackText.value,
    modProfileName: props.loggedInUserModName,
    channelId: props.activeDiscussionChannel?.channelUniqueName,
    discussionChannelId: props.activeDiscussionChannel?.id,
  });
};

const handleFeedbackInput = (event: string) => {
  feedbackText.value = event;
};

const handleClickUndoFeedback = () => {
  showConfirmUndoFeedbackModal.value = true;
};

const handleClickEditFeedback = () => {
  showEditFeedbackModal.value = true;
};

defineExpose({
  handleClickGiveFeedback,
  handleClickUndoFeedback,
  handleClickEditFeedback,
});
</script>

<template>
  <div>
    <GenericFeedbackFormModal
      v-if="showFeedbackFormModal"
      :error="addFeedbackCommentToDiscussionError?.message"
      :loading="addFeedbackCommentToDiscussionLoading"
      :open="showFeedbackFormModal"
      :primary-button-disabled="!feedbackText"
      @close="showFeedbackFormModal = false"
      @primary-button-click="handleSubmitFeedback"
      @update-feedback="handleFeedbackInput"
    />
    <ConfirmUndoDiscussionFeedbackModal
      v-if="showConfirmUndoFeedbackModal"
      :key="loggedInUserModName"
      :discussion-id="discussionId"
      :mod-name="loggedInUserModName"
      :open="showConfirmUndoFeedbackModal"
      @close="showConfirmUndoFeedbackModal = false"
    />
    <EditFeedbackModal
      v-if="showEditFeedbackModal"
      :discussion-id="discussionId"
      :mod-name="loggedInUserModName"
      :open="showEditFeedbackModal"
      @close="showEditFeedbackModal = false"
    />
    <Notification
      :show="showFeedbackSubmittedSuccessfully"
      :title="'Your feedback was submitted successfully.'"
      @close-notification="showFeedbackSubmittedSuccessfully = false"
    />
  </div>
</template>

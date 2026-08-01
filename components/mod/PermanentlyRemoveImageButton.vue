<script setup lang="ts">
import { ref } from 'vue';
import { useApolloClient, useMutation } from '@vue/apollo-composable';
import GenericModal from '@/components/GenericModal.vue';
import Notification from '@/components/NotificationComponent.vue';
import TrashIcon from '@/components/icons/TrashIcon.vue';
import TextEditor from '@/components/TextEditor.vue';
import { PERMANENTLY_REMOVE_IMAGE } from '@/graphQLData/issue/mutations';
import { GET_ISSUE } from '@/graphQLData/issue/queries';

const props = defineProps({
  imageId: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['removed-successfully']);

const showModal = ref(false);
const showSuccess = ref(false);
const explanation = ref('');

const { client } = useApolloClient();

const {
  mutate: permanentlyRemoveImage,
  loading: permanentlyRemoveImageLoading,
  error: permanentlyRemoveImageError,
  onDone: permanentlyRemoveImageDone,
} = useMutation(PERMANENTLY_REMOVE_IMAGE);

permanentlyRemoveImageDone(() => {
  // Refresh the issue so the newly recorded permanent-removal action and the
  // closed-issue state appear in the activity feed.
  client.refetchQueries({ include: [GET_ISSUE] });
  showModal.value = false;
  explanation.value = '';
  showSuccess.value = true;
  emit('removed-successfully');
});

const openModal = () => {
  if (props.disabled) {
    return;
  }
  showModal.value = true;
};

const closeModal = () => {
  if (permanentlyRemoveImageLoading.value) {
    return;
  }
  showModal.value = false;
  explanation.value = '';
};

const submit = () => {
  if (!explanation.value.trim()) {
    return;
  }
  permanentlyRemoveImage({
    imageId: props.imageId,
    explanation: explanation.value,
  });
};
</script>

<template>
  <button
    data-testid="permanently-remove-image-button"
    class="font-semibold flex items-center justify-center gap-2 rounded px-3 py-1.5 text-sm text-white transition"
    :class="{
      'cursor-pointer bg-red-600 hover:bg-red-500': !disabled,
      'cursor-not-allowed bg-gray-500': disabled,
    }"
    :disabled="disabled"
    @click="openModal"
  >
    <TrashIcon class="h-4 w-4" />
    Permanently remove image
  </button>
  <GenericModal
    data-testid="permanently-remove-image-modal"
    :highlight-color="'red'"
    :title="'Permanently remove image'"
    :body="'This permanently removes the image and cannot be undone. A moderation record of this action will be created on the issue.'"
    :open="showModal"
    :primary-button-text="'Permanently remove'"
    :secondary-button-text="'Cancel'"
    :loading="permanentlyRemoveImageLoading"
    :primary-button-disabled="!explanation.trim()"
    :error="permanentlyRemoveImageError?.message"
    @primary-button-click="submit"
    @close="closeModal"
  >
    <template #icon>
      <TrashIcon
        class="h-6 w-6 text-red-600 opacity-100 dark:text-red-400"
        aria-hidden="true"
      />
    </template>
    <template #content>
      <h2 class="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Explain why this image is being permanently removed:
      </h2>
      <TextEditor
        test-id="permanently-remove-image-input"
        :initial-value="explanation"
        :placeholder="'Describe why this image violates the rules and is being permanently removed'"
        :disable-auto-focus="false"
        :allow-image-upload="false"
        @update="explanation = $event"
      />
    </template>
  </GenericModal>
  <Notification
    :show="showSuccess"
    :title="'The image was permanently removed.'"
    @close-notification="showSuccess = false"
  />
</template>

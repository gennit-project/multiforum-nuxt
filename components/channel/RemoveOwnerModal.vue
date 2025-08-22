<script lang="ts" setup>
import { ref, computed } from 'vue';
import GenericModal from '@/components/GenericModal.vue';
import TextInput from '@/components/TextInput.vue';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  forumName: {
    type: String,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close', 'confirm']);

const forumNameConfirmation = ref('');

const isValidConfirmation = computed(() => {
  return forumNameConfirmation.value === props.forumName;
});

const handleConfirm = () => {
  if (isValidConfirmation.value) {
    emit('confirm');
  }
};

const handleClose = () => {
  forumNameConfirmation.value = '';
  emit('close');
};

const title = computed(() => 'Remove Yourself as Owner');
const body = computed(
  () =>
    'This action cannot be undone. You will no longer be able to change forum settings.'
);
</script>

<template>
  <GenericModal
    :highlight-color="'red'"
    :title="title"
    :body="body"
    :open="open"
    :loading="loading"
    :primary-button-text="'Remove Myself'"
    :secondary-button-text="'Cancel'"
    :error="error"
    :warning-color="true"
    :primary-button-disabled="!isValidConfirmation"
    @primary-button-click="handleConfirm"
    @close="handleClose"
  >
    <template #icon>
      <i class="fas fa-exclamation-triangle text-red-500 dark:text-red-400" />
    </template>
    <template #content>
      <div class="mt-4 space-y-4">
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
          Please type
          <span class="rounded bg-gray-100 px-1 font-mono dark:bg-gray-800">{{
            forumName
          }}</span>
          to confirm:
        </p>
        <TextInput
          :test-id="'forum-name-confirmation'"
          :value="forumNameConfirmation"
          :placeholder="'Enter forum name'"
          :full-width="true"
          @update="forumNameConfirmation = $event"
        />
        <p
          v-if="forumNameConfirmation && !isValidConfirmation"
          class="text-sm text-red-600 dark:text-red-400"
        >
          Forum name doesn't match. Please try again.
        </p>
      </div>
    </template>
  </GenericModal>
</template>

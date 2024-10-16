<script setup lang="ts">
import GenericModal from "@/components/GenericModal.vue";
import HandThumbDownIcon from "@/components/icons/HandThumbDownIcon.vue";
import TextEditor from '@/components/TextEditor.vue'
import ErrorBanner from "@/components/ErrorBanner.vue";

const props = defineProps({
  error: {
    type: String,
    default: "",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  open: {
    type: Boolean,
    default: false,
  },
  primaryButtonDisabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['updateFeedback']);

const title = "Give Semi-anonymous Feedback";
const body = "Do you have any actionable feedback for the author?";

function updateFeedback(text: string) {
  emit('updateFeedback', text);
}
</script>

<template>
  <GenericModal
    :highlight-color="'yellow'"
    :title="title"
    :body="body"
    :primary-button-disabled="props.loading || props.primaryButtonDisabled"
    :open="props.open"
    :loading="props.loading"
    :primary-button-text="'Submit'"
    :secondary-button-text="'Cancel'"
  >
    <template #icon>
      <HandThumbDownIcon
        class="h-6 w-6 text-yellow-600 opacity-100"
        aria-hidden="true"
      />
    </template>
    <template #content>
      <TextEditor
        :test-id="'description-input'"
        :initial-value="''"
        :placeholder="'How can the author improve their post?'"
        :disable-auto-focus="false"
        :allow-image-upload="false"
        @update="updateFeedback"
      />
      <ErrorBanner
        v-if="props.error"
        :text="props.error"
      />
      <p class="text-gray-600 dark:text-gray-400">
        Feedback is intended to be a helpful tool for the author. If you think
        the post should be removed, report it.
      </p>
    </template>
  </GenericModal>
</template>

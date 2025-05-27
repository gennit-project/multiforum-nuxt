<script setup lang="ts">
import { ref } from "vue";
import GenericModal from "@/components/GenericModal.vue";
import HandThumbDownIcon from "@/components/icons/HandThumbDownIcon.vue";
import TextEditor from "@/components/TextEditor.vue";
import CharCounter from "@/components/CharCounter.vue";

const FEEDBACK_MIN_LENGTH = 15;
const FEEDBACK_MAX_LENGTH = 500;

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

const emit = defineEmits(["updateFeedback"]);

const title = "Give Semi-anonymous Feedback";
const body = "Do you have any actionable feedback for the author?";
const currentLength = ref(0);

function updateFeedback(text: string) {
  currentLength.value = text.length;
  emit("updateFeedback", text);
}
</script>

<template>
  <GenericModal
    :data-testid="'feedback-form-modal'"
    :highlight-color="'yellow'"
    :title="title"
    :body="body"
    :primary-button-disabled="
      props.loading ||
      props.primaryButtonDisabled ||
      !!props.error ||
      currentLength < FEEDBACK_MIN_LENGTH ||
      currentLength > FEEDBACK_MAX_LENGTH
    "
    :open="props.open"
    :loading="props.loading"
    :primary-button-text="'Submit'"
    :secondary-button-text="'Cancel'"
    :error="props.error"
  >
    <template #icon>
      <HandThumbDownIcon
        class="h-6 w-6 text-yellow-600 dark:text-yellow-400 opacity-100"
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
      <CharCounter
        :current="currentLength"
        :max="FEEDBACK_MAX_LENGTH"
        :min="FEEDBACK_MIN_LENGTH"
      />
      <p class="mt-1 text-gray-600 dark:text-gray-300 text-sm">
        Feedback is intended to be a helpful tool for the author. If you think
        the post should be removed, report it.
      </p>
    </template>
  </GenericModal>
</template>

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
    :body="body"
    :data-testid="'feedback-form-modal'"
    :error="props.error"
    :highlight-color="'yellow'"
    :loading="props.loading"
    :open="props.open"
    :primary-button-disabled="
      props.loading ||
      props.primaryButtonDisabled ||
      !!props.error ||
      currentLength < FEEDBACK_MIN_LENGTH ||
      currentLength > FEEDBACK_MAX_LENGTH
    "
    :primary-button-text="'Submit'"
    :secondary-button-text="'Cancel'"
    :title="title"
  >
    <template #icon>
      <HandThumbDownIcon
        aria-hidden="true"
        class="h-6 w-6 text-yellow-600 opacity-100 dark:text-yellow-400"
      />
    </template>
    <template #content>
      <TextEditor
        :allow-image-upload="false"
        :disable-auto-focus="false"
        :initial-value="''"
        :placeholder="'How can the author improve their post?'"
        :test-id="'description-input'"
        @update="updateFeedback"
      />
      <CharCounter
        :current="currentLength"
        :max="FEEDBACK_MAX_LENGTH"
        :min="FEEDBACK_MIN_LENGTH"
      />
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
        Feedback is intended to be a helpful tool for the author. If you think the post should be
        removed, report it.
      </p>
    </template>
  </GenericModal>
</template>

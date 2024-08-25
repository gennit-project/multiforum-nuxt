<script lang="ts">
import { defineComponent } from "vue";
import GenericModal from "@/components/GenericModal.vue";
import HandThumbDownIcon from "@/components/icons/HandThumbDownIcon.vue";
import TextEditor from '@/components/forms/TextEditor.vue'
import ErrorBanner from "@/components/ErrorBanner.vue";

export default defineComponent({
  name: "DiscussionFeedbackFormModal",
  components: {
    ErrorBanner,
    GenericModal,
    HandThumbDownIcon,
    TextEditor,
  },
  props: {
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
  },
  setup() {
    return {
      title: "Give Semi-anonymous Feedback",
      body: "Do you have any actionable feedback for the author?",
    };
  },
  methods: {
    updateFeedback(text: string) {
      this.$emit('updateFeedback', text);
    },
  },
});
</script>
<template>
  <GenericModal
    :highlight-color="'yellow'"
    :title="title"
    :body="body"
    :open="open"
    :loading="loading"
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
        v-if="error"
        :text="error"
      />
      <p class="text-gray-600 dark:text-gray-400">
        Feedback is intended to be a helpful tool for the author. If you think
        the post should be removed, report it.
      </p>
    </template>
  </GenericModal>
</template>

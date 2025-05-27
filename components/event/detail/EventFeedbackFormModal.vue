<script>
import { defineComponent } from "vue";
import GenericModal from "@/components/GenericModal.vue";
import ExclamationIcon from "@/components/icons/ExclamationIcon.vue";

export default defineComponent({
  name: "EventFeedbackFormModal",
  components: {
    GenericModal,
    ExclamationIcon,
  },
  props: {
    title: {
      type: String,
      require: true,
      default: "Are you sure?",
    },
    body: {
      type: String,
      require: true,
      default: ''
    },
    open: {
      type: Boolean,
      default: false,
    },
    primaryButtonText: {
      type: String,
      default: "Delete",
    },
    secondaryButtonText: {
      type: String,
      default: "Cancel",
    },
  },
  setup() {},
});
</script>
<template>
  <GenericModal
    :highlight-color="'yellow'"
    :title="title"
    :body="body"
    :open="open"
    :primary-button-text="primaryButtonText"
    :secondary-button-text="secondaryButtonText"
  >
    <ExclamationIcon
      class="h-6 w-6 text-yellow-600 opacity-100"
      aria-hidden="true"
    />
  </GenericModal>
</template>
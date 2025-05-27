<script>
import { defineComponent } from "vue";
import GenericModal from "./GenericModal.vue";
import ExclamationIcon from '@/components/icons/ExclamationIcon.vue';

export default defineComponent({
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
      default: "",
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
    icon: {
      type: String,
      default: "ExclamationIcon",
    },
    error: {
      type: String,
      default: "",
    },
    loading: {
      type: Boolean,
      default: false,
    },
    dataTestid: {
      type: String,
      default: "",
    },
  },
  setup() {},
});
</script>
<template>
  <GenericModal
    :data-testid="dataTestid"
    :highlight-color="'yellow'"
    :title="title"
    :body="body"
    :open="open"
    :primary-button-text="primaryButtonText"
    :secondary-button-text="secondaryButtonText"
    :error="error"
    :loading="loading"
  >
    <template #icon>
      <i
        v-if="icon === 'trash'"
        class="fas fa-trash-alt dark:text-gray-100"
      />
      <ExclamationIcon
        v-else
        class="dark:text-gray-100"
      />
    </template>
  </GenericModal>
</template>

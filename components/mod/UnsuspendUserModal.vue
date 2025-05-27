<script setup lang="ts">
import { computed, ref } from "vue";
import GenericModal from "@/components/GenericModal.vue";
import TextEditor from "@/components/TextEditor.vue";
import UserPlus from "@/components/icons/UserPlus.vue";
import { useMutation } from "@vue/apollo-composable";
import { IS_ORIGINAL_POSTER_SUSPENDED } from "@/graphQLData/mod/queries";
import { UNSUSPEND_USER } from "@/graphQLData/mod/mutations";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  issueId: {
    type: String,
    required: false,
    default: "",
  },
  title: {
    type: String,
    required: false,
    default: "",
  },
});
const emit = defineEmits(["close", "unsuspendedSuccessfully"]);

const explanation = ref("No violation");

const {
  mutate: unsuspendUser,
  loading: unsuspendUserLoading,
  error: unsuspendUserError,
  onDone: unsuspendDone,
} = useMutation(UNSUSPEND_USER, {
  update: (cache) => {
    cache.writeQuery({
      query: IS_ORIGINAL_POSTER_SUSPENDED,
      variables: {
        issueId: props.issueId,
      },
      data: {
        isOriginalPosterSuspended: false,
      },
    });
  },
});

unsuspendDone(() => {
  emit("unsuspendedSuccessfully");
});

const modalTitle = computed(() => {
  return "Unsuspend Author";
});

const modalBody = computed(() => {
  return `(Optional) Please add any more information or context about why this user should be unsuspended.`;
});

const submit = async () => {
  if (!props.issueId) {
    console.error("No issue ID provided.");
    return;
  }
  await unsuspendUser({
    issueId: props.issueId,
    explanation: explanation.value,
  });
};

const close = () => {
  emit("close");
};
</script>

<template>
  <GenericModal
    :highlight-color="'green'"
    :title="modalTitle"
    :open="open"
    :body="modalBody"
    :primary-button-text="'Submit'"
    :secondary-button-text="'Cancel'"
    :loading="unsuspendUserLoading"
    :primary-button-disabled="explanation.length === 0"
    :error="unsuspendUserError?.message"
    @primary-button-click="submit"
    @close="close"
  >
    <template #icon>
      <UserPlus
        class="h-6 w-6 text-green-600 opacity-100 dark:text-green-400"
        aria-hidden="true"
      />
    </template>
    <template #content>
      <TextEditor
        :test-id="'report-discussion-input'"
        :initial-value="explanation"
        :disable-auto-focus="false"
        :allow-image-upload="false"
        @update="explanation = $event"
      />
    </template>
  </GenericModal>
</template>

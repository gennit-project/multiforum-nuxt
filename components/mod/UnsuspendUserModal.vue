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
    :body="modalBody"
    :error="unsuspendUserError?.message"
    :highlight-color="'green'"
    :loading="unsuspendUserLoading"
    :open="open"
    :primary-button-disabled="explanation.length === 0"
    :primary-button-text="'Submit'"
    :secondary-button-text="'Cancel'"
    :title="modalTitle"
    @close="close"
    @primary-button-click="submit"
  >
    <template #icon>
      <UserPlus
        aria-hidden="true"
        class="h-6 w-6 text-green-600 opacity-100 dark:text-green-400"
      />
    </template>
    <template #content>
      <TextEditor
        :allow-image-upload="false"
        :disable-auto-focus="false"
        :initial-value="explanation"
        :test-id="'report-discussion-input'"
        @update="explanation = $event"
      />
    </template>
  </GenericModal>
</template>

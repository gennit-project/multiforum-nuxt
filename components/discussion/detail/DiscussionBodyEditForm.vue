<script lang="ts" setup>
import { ref } from "vue";
import type { PropType } from "vue";
import type { Discussion } from "@/__generated__/graphql";
import PrimaryButton from "@/components/PrimaryButton.vue";
import GenericButton from "@/components/GenericButton.vue";
import { useMutation } from "@vue/apollo-composable";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS } from "@/graphQLData/discussion/mutations";
import { MAX_CHARS_IN_DISCUSSION_BODY } from "@/utils/constants";

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion>,
    required: true,
  },
});
const emits = defineEmits(["closeEditor"]);
const formValues = ref({
  body: props.discussion?.body || "",
});

const {
  mutate: updateDiscussion,
  error: updateDiscussionError,
  loading: updateDiscussionLoading,
  onDone,
} = useMutation(UPDATE_DISCUSSION_WITH_CHANNEL_CONNECTIONS, () => ({
  variables: {
    discussionWhere: { id: props.discussion.id },
    updateDiscussionInput: formValues.value,
  },
}));

onDone(() => {
  emits("closeEditor");
});
</script>

<template>
  <div class="w-full">
    <div class="mb-2 mt-4 w-full flex flex-col">
      <TextEditor
        class="mb-3"
        :test-id="'body-input'"
        :disable-auto-focus="false"
        :initial-value="formValues.body || ''"
        :placeholder="'Add details'"
        :rows="8"
        @update="formValues.body = $event"
      />
      <CharCounter
        :current="formValues.body?.length || 0"
        :max="MAX_CHARS_IN_DISCUSSION_BODY"
      />
      <div class="flex align-items gap-2 justify-end">
        <GenericButton :text="'Cancel'" @click="emits('closeEditor')" />
        <PrimaryButton
          :disabled="
            formValues.body.length === 0 ||
            formValues.body.length > MAX_CHARS_IN_DISCUSSION_BODY
          "
          :label="'Save'"
          :loading="updateDiscussionLoading"
          @click="updateDiscussion"
        />
      </div>
    </div>
    <ErrorBanner
      v-if="updateDiscussionError"
      class="mx-auto my-3 max-w-5xl"
      :text="updateDiscussionError.message"
    />
  </div>
</template>

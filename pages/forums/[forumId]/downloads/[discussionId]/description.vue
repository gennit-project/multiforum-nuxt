<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "nuxt/app";
import { useMutation } from "@vue/apollo-composable";
import { UPDATE_DISCUSSION } from "@/graphQLData/discussion/mutations";
import { usernameVar } from "@/cache";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import PencilIcon from "@/components/icons/PencilIcon.vue";
import TextEditor from "@/components/TextEditor.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";
import GenericButton from "@/components/GenericButton.vue";
import CharCounter from "@/components/CharCounter.vue";
import { MAX_CHARS_IN_DISCUSSION_BODY } from "@/utils/constants";
import type {
  Discussion,
  DiscussionUpdateInput,
} from "@/__generated__/graphql";

const props = defineProps<{
  discussion: Discussion;
}>();

const route = useRoute();

const discussionId = computed(() => {
  return typeof route.params.discussionId === "string"
    ? route.params.discussionId
    : "";
});

const bodyText = computed(() => props.discussion.body || "");

const isOwnDiscussion = computed(() => {
  return props.discussion.Author?.username === usernameVar.value;
});

// Edit mode state
const editMode = ref(false);
const formValues = ref({
  body: "",
});

// Initialize form values when discussion loads
const initializeFormValues = () => {
  formValues.value.body = props.discussion.body || "";
};

// Watch for discussion changes to initialize form
watch(
  () => props.discussion,
  () => {
    if (!editMode.value) {
      initializeFormValues();
    }
  },
  { immediate: true }
);

// Update discussion mutation
const {
  mutate: updateDiscussion,
  error: updateDiscussionError,
  loading: updateDiscussionLoading,
  onDone,
} = useMutation(UPDATE_DISCUSSION, () => ({
  variables: {
    where: { id: discussionId.value },
    updateDiscussionInput: {
      body: formValues.value.body,
    } as DiscussionUpdateInput,
  },
}));

onDone(() => {
  editMode.value = false;
});

const handleEdit = () => {
  initializeFormValues();
  editMode.value = true;
};

const handleCancel = () => {
  editMode.value = false;
  initializeFormValues();
};
</script>

<template>
  <div class="px-2">
    <div class="flex flex-row space-x-4 lg:flex-col lg:space-x-0 lg:space-y-4">
      <!-- Description content and fallback -->
      <div v-if="!editMode" class="flex-1 min-w-0">
        <div v-if="props.discussion.body" class="rounded">
          <MarkdownPreview :disable-gallery="false" :text="bodyText" />
        </div>
        <div v-else class="text-gray-500 dark:text-gray-400 py-8 text-center">
          No description available for this download.
        </div>
      </div>

      <button
        v-if="isOwnDiscussion && !editMode"
        type="button"
        class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 self-start lg:self-end"
        @click="handleEdit"
        data-testid="edit-download-button"
      >
        <PencilIcon class="h-4 w-4" />
        Edit Description
      </button>

      <!-- Edit form -->
      <div v-else class="flex-1 min-w-0">
        <div class="mb-3 mt-3 w-full flex flex-col">
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
          <div class="flex align-items gap-2 justify-end mt-2">
            <GenericButton :text="'Cancel'" @click="handleCancel" />
            <PrimaryButton
              :disabled="formValues.body.length > MAX_CHARS_IN_DISCUSSION_BODY"
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
    </div>
  </div>
</template>

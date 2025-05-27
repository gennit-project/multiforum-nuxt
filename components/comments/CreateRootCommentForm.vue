<script setup lang="ts">
import RequireAuth from "@/components/auth/RequireAuth.vue";
import type { PropType } from "vue";
import TextEditor from "@/components/TextEditor.vue";
import CancelButton from "@/components/CancelButton.vue";
import SaveButton from "@/components/SaveButton.vue";
import ErrorBanner from "../ErrorBanner.vue";
import type { ApolloError } from "@apollo/client/errors";
import type { CreateEditCommentFormValues } from "@/types/Comment";
import { usernameVar } from "@/cache";
import LoggedInUserAvatar from "./LoggedInUserAvatar.vue";
import { MAX_CHARS_IN_COMMENT } from "@/utils/constants";

defineProps({
  createCommentError: {
    type: Object as PropType<ApolloError | null>,
    required: false,
    default: null,
  },
  createCommentLoading: {
    type: Boolean,
    required: true,
  },
  createFormValues: {
    type: Object as PropType<CreateEditCommentFormValues>,
    required: true,
  },
  commentEditorOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits([
  "openCommentEditor",
  "closeCommentEditor",
  "handleUpdateComment",
  "handleCreateComment",
]);

<<<<<<< HEAD
  const writeReplyStyle =
    "block h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:placeholder-gray-400 dark:focus:ring-gray-9";
=======
const writeReplyStyle =
  "block h-10 w-full rounded-lg border-gray-300 dark:bg-gray-700 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-800 dark:placeholder-gray-400 dark:focus:ring-gray-9";
>>>>>>> parent of 666ae3d (Use automated formatting tools)
</script>

<template>
  <div class="flex w-full flex-col space-x-2">
    <ErrorBanner
      v-if="createCommentError"
      :text="createCommentError?.message"
    />
    <div class="flex gap-2 w-full">
      <RequireAuth
        v-if="!commentEditorOpen"
        :justify-left="true"
        :full-width="true"
      >
        <template #has-auth>
          <div class="flex align-items w-full gap-2">
            <LoggedInUserAvatar v-if="usernameVar" />
            <textarea
<<<<<<< HEAD
              class="flex-1 overflow-hidden dark:bg-gray-700"
              :class="writeReplyStyle"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
              data-testid="addComment"
              class="flex-1 border overflow-hidden"
              name="addComment"
              :rows="1"
              placeholder="Write a comment"
              :class="writeReplyStyle"
              @click="emit('openCommentEditor')"
            />
          </div>
        </template>
        <template #does-not-have-auth>
          <div class="flex align-items w-full gap-2">
            <PlaceholderAvatar />
            <textarea
              id="addCommentLoginPrompt"
              name="addComment"
              :rows="1"
              placeholder="Write a comment"
              :class="writeReplyStyle"
            />
          </div>
        </template>
      </RequireAuth>

      <div v-else class="flex-1 w-full flex-col">
        <TextEditor
          :test-id="'texteditor-textarea'"
          :placeholder="'Please be kind'"
          :show-char-counter="true"
          :max-chars="MAX_CHARS_IN_COMMENT"
          @update="emit('handleUpdateComment', $event)"
        />
        <div class="mt-3 flex justify-start">
          <CancelButton @click="emit('closeCommentEditor')" />
          <SaveButton
            data-testid="createCommentButton"
            :disabled="
              createFormValues.text.length === 0 ||
              createFormValues.text.length > MAX_CHARS_IN_COMMENT
            "
            :loading="createCommentLoading && !createCommentError"
            @click.prevent="emit('handleCreateComment')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

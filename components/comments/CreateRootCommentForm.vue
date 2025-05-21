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

  const writeReplyStyle =
    "block h-10 w-full rounded-lg border border-black dark:bg-gray-700 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-800 dark:placeholder-gray-400 dark:focus:ring-gray-9";
</script>

<template>
  <div class="ml-1 flex w-full flex-col space-x-2">
    <ErrorBanner
      v-if="createCommentError"
      :text="createCommentError?.message"
    />
    <div class="flex w-full gap-2">
      <RequireAuth
        v-if="!commentEditorOpen"
        :full-width="true"
        :justify-left="true"
      >
        <template #has-auth>
          <div class="align-items flex w-full gap-2">
            <LoggedInUserAvatar v-if="usernameVar" />
            <textarea
              class="flex-1 overflow-hidden border border-black"
              :class="writeReplyStyle"
              data-testid="addComment"
              name="addComment"
              placeholder="Write a comment"
              :rows="1"
              @click="emit('openCommentEditor')"
            />
          </div>
        </template>
        <template #does-not-have-auth>
          <div class="align-items flex w-full gap-2">
            <PlaceholderAvatar />
            <textarea
              id="addCommentLoginPrompt"
              :class="writeReplyStyle"
              name="addComment"
              placeholder="Write a comment"
              :rows="1"
            />
          </div>
        </template>
      </RequireAuth>

      <div
        v-else
        class="w-full flex-1 flex-col"
      >
        <TextEditor
          :max-chars="MAX_CHARS_IN_COMMENT"
          :placeholder="'Please be kind'"
          :show-char-counter="true"
          :test-id="'texteditor-textarea'"
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

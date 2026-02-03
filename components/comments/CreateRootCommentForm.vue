<script setup lang="ts">
import RequireAuth from '@/components/auth/RequireAuth.vue';
import { computed, defineAsyncComponent } from 'vue';
import type { PropType } from 'vue';
import CancelButton from '@/components/CancelButton.vue';
import SaveButton from '@/components/SaveButton.vue';
import ErrorBanner from '../ErrorBanner.vue';
import SuspensionNotice from '@/components/SuspensionNotice.vue';
import type { ApolloError } from '@apollo/client/errors';
import type { CreateEditCommentFormValues } from '@/types/Comment';
import { usernameVar } from '@/cache';
import LoggedInUserAvatar from './LoggedInUserAvatar.vue';
import { MAX_CHARS_IN_COMMENT } from '@/utils/constants';
import { hasBotMention, type BotSuggestion } from '@/utils/botMentions';

// Lazy-load TextEditor to defer loading until user clicks "Write a comment"
const TextEditor = defineAsyncComponent(
  () => import('@/components/TextEditor.vue')
);

const props = defineProps({
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
  allowBotMentions: {
    type: Boolean,
    required: false,
    default: true,
  },
  botSuggestions: {
    type: Array as PropType<BotSuggestion[]>,
    required: false,
    default: () => [],
  },
  suspensionIssueNumber: {
    type: Number,
    required: false,
    default: null,
  },
  suspensionChannelId: {
    type: String,
    required: false,
    default: '',
  },
  suspensionUntil: {
    type: String,
    required: false,
    default: null,
  },
  suspensionIndefinitely: {
    type: Boolean,
    required: false,
    default: false,
  },
  suspensionMessage: {
    type: String,
    required: false,
    default: 'You are suspended and cannot create comments.',
  },
});

const emit = defineEmits([
  'openCommentEditor',
  'closeCommentEditor',
  'handleUpdateComment',
  'handleCreateComment',
]);

const writeReplyStyle =
  'block h-10 w-full rounded-lg border-gray-300 dark:bg-gray-700 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-gray-9';

const botMentionsBlocked = computed(() => {
  return !props.allowBotMentions && hasBotMention(props.createFormValues?.text);
});
</script>

<template>
  <div class="ml-1 flex w-full flex-col space-x-2">
    <ErrorBanner
      v-if="createCommentError"
      :text="createCommentError?.message"
    />
    <SuspensionNotice
      v-if="suspensionIssueNumber && suspensionChannelId"
      class="mb-2"
      :issue-number="suspensionIssueNumber"
      :channel-id="suspensionChannelId"
      :suspended-until="suspensionUntil"
      :suspended-indefinitely="suspensionIndefinitely"
      :message="suspensionMessage"
    />
    <ErrorBanner
      v-if="botMentionsBlocked"
      class="mb-2"
      :text="'Bot mentions are only available in discussion comments.'"
    />
    <div class="mt-2 flex w-full gap-2">
      <RequireAuth
        v-if="!commentEditorOpen"
        :justify-left="true"
        :full-width="true"
      >
        <template #has-auth>
          <div class="align-items flex w-full gap-2">
            <LoggedInUserAvatar v-if="usernameVar" />
            <textarea
              data-testid="addComment"
              class="flex-1 overflow-hidden border"
              name="addComment"
              :rows="1"
              placeholder="Write a comment"
              :class="writeReplyStyle"
              @click="emit('openCommentEditor')"
            />
          </div>
        </template>
        <template #does-not-have-auth>
          <div class="align-items flex w-full gap-2">
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

      <div v-else class="w-full flex-1 flex-col">
        <TextEditor
          :test-id="'texteditor-textarea'"
          :placeholder="'Please be kind'"
          :show-char-counter="true"
          :max-chars="MAX_CHARS_IN_COMMENT"
          :enable-bot-autocomplete="allowBotMentions"
          :bot-suggestions="botSuggestions"
          @update="emit('handleUpdateComment', $event)"
        />
        <div class="mt-3 flex justify-start">
          <CancelButton @click="emit('closeCommentEditor')" />
          <SaveButton
            data-testid="createCommentButton"
            :disabled="
              createFormValues.text.length === 0 ||
              createFormValues.text.length > MAX_CHARS_IN_COMMENT ||
              botMentionsBlocked
            "
            :loading="createCommentLoading && !createCommentError"
            @click.prevent="emit('handleCreateComment')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

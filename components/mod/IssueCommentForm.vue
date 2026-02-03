<script lang="ts" setup>
import { computed } from 'vue';
import { hasBotMention } from '@/utils/botMentions';
import ErrorBanner from '@/components/ErrorBanner.vue';
import GenericButton from '@/components/GenericButton.vue';
import SaveButton from '@/components/SaveButton.vue';
import TextEditor from '@/components/TextEditor.vue';
import XCircleIcon from '@/components/icons/XCircleIcon.vue';
import ArrowPathIcon from '@/components/icons/ArrowPath.vue';

const props = defineProps<{
  commentText: string;
  isIssueOpen: boolean;
  isLocked: boolean;
  isSuspendedMod: boolean;
  isOriginalUserAuthor: boolean;
  closeIssueLoading: boolean;
  reopenIssueLoading: boolean;
  lockIssueLoading: boolean;
  unlockIssueLoading: boolean;
  commentLoading: boolean;
  lockIssueError?: { message: string } | null;
  unlockIssueError?: { message: string } | null;
}>();

const emit = defineEmits<{
  (e: 'update:commentText', value: string): void;
  (
    e: 'toggleCloseOpen' | 'createComment' | 'openLockDialog' | 'unlockIssue'
  ): void;
}>();

const botMentionsBlocked = computed(() => hasBotMention(props.commentText));

const closeOpenButtonText = computed(() => {
  if (props.isIssueOpen) {
    return props.commentText ? 'Close with comment' : 'Close issue';
  }
  return props.commentText ? 'Reopen with comment' : 'Reopen issue';
});

const isCommentDisabled = computed(() => {
  return (
    props.commentText.length === 0 ||
    (props.isSuspendedMod && !props.isOriginalUserAuthor) ||
    botMentionsBlocked.value ||
    props.isLocked
  );
});

const updateComment = (text: string) => {
  emit('update:commentText', text);
};
</script>

<template>
  <div class="flex w-full flex-col">
    <h2 class="mt-8 border-b pb-1 text-xl font-bold">Leave a comment</h2>
    <ErrorBanner
      v-if="botMentionsBlocked"
      class="mt-2"
      :text="'Bot mentions are only available in discussion comments.'"
    />
    <TextEditor
      :key="`${commentText === ''}`"
      :test-id="'texteditor-textarea'"
      :disable-auto-focus="true"
      :placeholder="'Please be kind'"
      :initial-value="commentText"
      @update="updateComment"
    />
    <!-- Lock/Unlock errors -->
    <ErrorBanner
      v-if="lockIssueError"
      class="mt-2"
      :text="lockIssueError.message"
    />
    <ErrorBanner
      v-if="unlockIssueError"
      class="mt-2"
      :text="unlockIssueError.message"
    />

    <div class="mt-3 flex justify-end gap-2">
      <!-- Lock/Unlock Button -->
      <GenericButton
        v-if="!isLocked && !isSuspendedMod"
        :text="'Lock Issue'"
        :disabled="lockIssueLoading"
        :loading="lockIssueLoading"
        @click="emit('openLockDialog')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clip-rule="evenodd"
          />
        </svg>
      </GenericButton>
      <GenericButton
        v-if="isLocked && !isSuspendedMod"
        :text="'Unlock Issue'"
        :disabled="unlockIssueLoading"
        :loading="unlockIssueLoading"
        @click="emit('unlockIssue')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"
          />
        </svg>
      </GenericButton>

      <GenericButton
        :test-id="'close-open-issue-button'"
        :text="closeOpenButtonText"
        :loading="closeIssueLoading || reopenIssueLoading"
        :disabled="
          isSuspendedMod || closeIssueLoading || reopenIssueLoading || isLocked
        "
        @click="emit('toggleCloseOpen')"
      >
        <XCircleIcon v-if="isIssueOpen" />
        <ArrowPathIcon v-else />
      </GenericButton>
      <SaveButton
        :data-testid="'createCommentButton'"
        :label="'Comment'"
        :disabled="isCommentDisabled"
        :loading="commentLoading"
        @click.prevent="emit('createComment')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import type { Comment as CommentType } from '@/__generated__/graphql';
import type { BotSuggestion } from '@/utils/botMentions';
import Comment from './Comment.vue';

const props = defineProps({
  answers: {
    type: Array as PropType<CommentType[]>,
    default: () => [],
  },
  enableFeedback: {
    type: Boolean,
    default: true,
  },
  locked: {
    type: Boolean,
    default: false,
  },
  archived: {
    type: Boolean,
    default: false,
  },
  originalPoster: {
    type: String,
    default: '',
  },
  replyHasBotMention: {
    type: Boolean,
    default: false,
  },
  botSuggestions: {
    type: Array as PropType<BotSuggestion[]>,
    default: () => [],
  },
  botUsernames: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
});

const emit = defineEmits([
  'createComment',
  'delete-comment',
  'click-edit-comment',
  'openEditCommentEditor',
  'updateEditCommentInput',
  'updateCreateReplyCommentInput',
  'showCopiedLinkNotification',
  'clickReport',
  'clickFeedback',
  'clickUndoFeedback',
  'clickEditFeedback',
  'handleViewFeedback',
  'startCommentSave',
  'openReplyEditor',
  'hideReplyEditor',
  'hideEditCommentEditor',
  'saveEdit',
  'openModProfile',
  'scrollToTop',
  'handleClickArchive',
  'handleClickArchiveAndSuspend',
  'handleClickUnarchive',
  'update-edit-comment-input',
  'showMarkedAsBestAnswerNotification',
  'showUnmarkedAsBestAnswerNotification',
]);

const hasAnswers = computed(() => {
  return props.answers && props.answers.length > 0;
});
</script>

<template>
  <div
    v-if="hasAnswers"
    class="mb-6 rounded-lg border-2 border-green-500 p-4 dark:border-green-400"
  >
    <div class="mb-4 border-b border-gray-300 pb-2 dark:border-gray-600">
      <h3
        class="font-semibold flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100"
      >
        <div class="h-5 w-5 rounded-full bg-green-500" />
        Best {{ answers.length === 1 ? 'Answer' : 'Answers' }}
      </h3>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {{ answers.length === 1 ? 'This answer was' : 'These answers were' }}
        selected by the discussion author.
      </p>
    </div>

    <div class="space-y-4">
      <div v-for="answer in answers" :key="answer.id">
        <Comment
          :comment-data="answer"
          :depth="1"
          :enable-feedback="enableFeedback"
          :locked="locked || archived"
          :original-poster="originalPoster"
          :answers="answers"
          :reply-has-bot-mention="replyHasBotMention"
          :bot-suggestions="botSuggestions"
          :bot-usernames="botUsernames"
          :show-comment-buttons="true"
          :show-header="true"
          @create-comment="emit('createComment', $event)"
          @delete-comment="emit('delete-comment', $event)"
          @click-edit-comment="emit('click-edit-comment', $event)"
          @open-edit-comment-editor="emit('openEditCommentEditor', $event)"
          @update-edit-comment-input="emit('updateEditCommentInput', $event)"
          @update-create-reply-comment-input="
            emit('updateCreateReplyCommentInput', $event)
          "
          @show-copied-link-notification="
            emit('showCopiedLinkNotification', $event)
          "
          @show-marked-as-best-answer-notification="
            emit('showMarkedAsBestAnswerNotification', $event)
          "
          @show-unmarked-as-best-answer-notification="
            emit('showUnmarkedAsBestAnswerNotification', $event)
          "
          @click-report="emit('clickReport', $event)"
          @click-feedback="emit('clickFeedback', $event)"
          @click-undo-feedback="emit('clickUndoFeedback', $event)"
          @click-edit-feedback="emit('clickEditFeedback', $event)"
          @handle-view-feedback="emit('handleViewFeedback', $event)"
          @start-comment-save="emit('startCommentSave', $event)"
          @open-reply-editor="emit('openReplyEditor', $event)"
          @hide-reply-editor="emit('hideReplyEditor')"
          @hide-edit-comment-editor="emit('hideEditCommentEditor')"
          @save-edit="emit('saveEdit')"
          @open-mod-profile="emit('openModProfile')"
          @scroll-to-top="emit('scrollToTop')"
          @handle-click-archive="emit('handleClickArchive', $event)"
          @handle-click-archive-and-suspend="
            emit('handleClickArchiveAndSuspend', $event)
          "
          @handle-click-unarchive="emit('handleClickUnarchive', $event)"
        />
      </div>
    </div>
  </div>
</template>

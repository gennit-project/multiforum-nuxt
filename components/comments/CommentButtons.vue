<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import type { PropType } from 'vue';
import type { Comment, ModerationProfile, User } from '@/__generated__/graphql';
import VoteButtons from './VoteButtons.vue';
import ReplyButton from './ReplyButton.vue';
import SaveButton from '@/components/SaveButton.vue';
import TextEditor from '@/components/TextEditor.vue';
import CancelButton from '@/components/CancelButton.vue';
import EmojiButtons from './EmojiButtons.vue';
import NewEmojiButton from './NewEmojiButton.vue';
import AddToCommentFavorites from '@/components/favorites/AddToCommentFavorites.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import { usernameVar, modProfileNameVar } from '@/cache';
import { MAX_CHARS_IN_COMMENT } from '@/utils/constants';

const props = defineProps({
  commentData: {
    type: Object as PropType<Comment>,
    required: true,
  },
  enableFeedback: {
    type: Boolean,
    default: true,
  },
  depth: {
    type: Number,
    required: true,
  },
  lengthOfCommentInProgress: {
    type: Number,
    default: 0,
  },
  replyHasBotMention: {
    type: Boolean,
    default: false,
  },
  botSuggestions: {
    type: Array as PropType<
      { value: string; label: string; isDeprecated?: boolean }[]
    >,
    default: () => [],
  },
  locked: {
    type: Boolean,
    default: false,
  },
  parentCommentId: {
    type: String,
    default: '',
  },
  replyCount: {
    type: Number,
    default: 0,
  },
  showEditCommentField: {
    type: Boolean,
    default: false,
  },
  showReplies: {
    type: Boolean,
    default: true,
  },
  commentInProcess: {
    type: Boolean,
    default: false,
  },
  replyFormOpenAtCommentID: {
    type: String,
    default: '',
  },
  saveDisabled: {
    type: Boolean,
    default: false,
  },
  isPermalinked: {
    type: Boolean,
    default: false,
  },
  isMarkedAsAnswer: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'openModProfile',
  'clickFeedback',
  'clickUndoFeedback',
  'clickEditFeedback',
  'handleViewFeedback',
  'openReplyEditor',
  'hideReplyEditor',
  'hideEditCommentEditor',
  'saveEdit',
  'startCommentSave',
  'hideReplies',
  'showReplies',
  'updateNewComment',
  'createComment',
]);

const route = useRoute();
const router = useRouter();

const loggedInUserIsAuthor = computed(() => {
  if (!props.commentData) {
    return false;
  }
  const author: User | ModerationProfile | undefined | null =
    props.commentData.CommentAuthor;
  if (!author) {
    return false;
  }

  if (author.__typename === 'ModerationProfile') {
    return modProfileNameVar.value === author.displayName;
  }

  if (author.__typename === 'User') {
    return usernameVar.value === author.username;
  }

  return false;
});

const showEmojiPicker = ref(false);

function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value;
  if (showEmojiPicker.value) {
    emit('hideReplyEditor');
  }
}
</script>

<template>
  <div class="w-full">
    <EmojiButtons
      v-if="!locked"
      :key="commentData.emoji"
      class="mb-1"
      :comment-id="commentData.id"
      :emoji-json="commentData.emoji"
      :is-permalinked="isPermalinked"
      @toggle-emoji-picker="toggleEmojiPicker"
    />
    <div class="flex flex-wrap items-center gap-1 text-xs">
      <VoteButtons
        :comment-data="commentData"
        :show-downvote="enableFeedback && !loggedInUserIsAuthor"
        :is-permalinked="isPermalinked"
        :is-marked-as-answer="isMarkedAsAnswer"
        @open-mod-profile="emit('openModProfile')"
        @click-feedback="emit('clickFeedback')"
        @click-undo-feedback="emit('clickUndoFeedback')"
        @click-edit-feedback="emit('clickEditFeedback')"
        @view-feedback="emit('handleViewFeedback')"
      />
      <NewEmojiButton
        :comment-id="commentData.id"
        :is-permalinked="isPermalinked"
        :is-marked-as-answer="isMarkedAsAnswer"
        @toggle-emoji-picker="toggleEmojiPicker"
      />
      <ReplyButton
        v-if="!locked"
        :show-reply-editor="!!replyFormOpenAtCommentID"
        :comment-data="commentData"
        :parent-comment-id="parentCommentId"
        :depth="depth"
        :is-permalinked="isPermalinked"
        :is-marked-as-answer="isMarkedAsAnswer"
        @click="emit('openReplyEditor', commentData.id)"
      />
      <span
        v-if="showEditCommentField"
        class="cursor-pointer rounded-full bg-gray-700 px-2 py-1 text-white hover:text-black dark:text-gray-100 dark:hover:text-white"
        @click="emit('hideEditCommentEditor')"
      >
        Cancel
      </span>
      <span
        v-if="showEditCommentField && !commentInProcess"
        :class="[
          saveDisabled
            ? 'rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
            : 'cursor-pointer rounded-full bg-orange-600 text-white hover:text-black dark:text-gray-100 dark:hover:text-white',
        ]"
        class="px-2 py-1"
        @click="
          () => {
            if (saveDisabled) {
              return;
            }
            emit('saveEdit');
            emit('startCommentSave');
          }
        "
      >
        Save
      </span>
      <span
        v-if="showEditCommentField && commentInProcess"
        class="cursor-pointer underline hover:text-black dark:text-gray-100 dark:hover:text-white"
      >
        Saving...
      </span>
      <span
        v-if="commentData.DiscussionChannel"
        :to="`${route.path}/comments/${commentData.id}`"
        class="cursor-pointer underline hover:text-black dark:text-gray-100 dark:hover:text-white"
        @click="
          router.push({
            name: 'forums-forumId-discussions-discussionId-comments-commentId',
            params: {
              forumId:
                commentData.DiscussionChannel?.channelUniqueName ||
                commentData.Channel?.uniqueName,
              discussionId: commentData.DiscussionChannel?.discussionId,
              commentId: commentData.id,
            },
          })
        "
      >
        Permalink
      </span>
      <span
        v-if="showReplies && replyCount > 0"
        class="cursor-pointer underline hover:text-black dark:text-gray-100 dark:hover:text-white"
        @click="emit('hideReplies')"
      >
        {{ `Hide ${replyCount} ${replyCount === 1 ? 'Reply' : 'Replies'}` }}
      </span>
      <span
        v-if="!showReplies"
        class="cursor-pointer underline hover:text-black dark:text-gray-100 dark:hover:text-white"
        @click="emit('showReplies')"
      >
        {{ `Show ${replyCount} ${replyCount === 1 ? 'Reply' : 'Replies'}` }}
      </span>
      <AddToCommentFavorites
        v-if="commentData"
        :allow-add-to-list="true"
        :comment-id="commentData.id"
        size="small"
      />
      <slot />
    </div>

    <div
      v-if="commentData && replyFormOpenAtCommentID === commentData.id"
      class="my-2 mt-1 w-full px-3 py-4 dark:bg-gray-700"
    >
      <ErrorBanner
        v-if="replyHasBotMention"
        class="mb-2"
        :text="'Bot mentions are only available in discussion comments.'"
      />
      <TextEditor
        :placeholder="'Please be kind'"
        :show-char-counter="true"
        :max-chars="MAX_CHARS_IN_COMMENT"
        :enable-bot-autocomplete="true"
        :bot-suggestions="botSuggestions"
        @update="
          emit('updateNewComment', {
            text: $event,
            parentCommentId: commentData.id,
            depth: depth + 1,
          })
        "
      />
      <div class="mt-4 flex justify-start space-x-2">
        <CancelButton @click="emit('hideReplyEditor')" />
        <SaveButton
          :loading="commentInProcess"
          :disabled="
            lengthOfCommentInProgress === 0 ||
            lengthOfCommentInProgress > MAX_CHARS_IN_COMMENT ||
            replyHasBotMention
          "
          @click.prevent="
            () => {
              emit('createComment', parentCommentId);
              emit('startCommentSave');
            }
          "
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>

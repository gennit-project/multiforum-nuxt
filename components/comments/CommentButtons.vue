<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { useRoute, useRouter } from "vue-router";
import type { PropType } from "vue";
import type { Comment } from "@/__generated__/graphql";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import VoteButtons from "./VoteButtons.vue";
import ReplyButton from "./ReplyButton.vue";
import SaveButton from "@/components/SaveButton.vue";
import TextEditor from "@/components/TextEditor.vue";
import CancelButton from "@/components/CancelButton.vue";
import EmojiButtons from "./EmojiButtons.vue";
import NewEmojiButton from "./NewEmojiButton.vue";

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
  locked: {
    type: Boolean,
    default: false,
  },
  parentCommentId: {
    type: String,
    default: "",
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
    default: "",
  },
});

const emit = defineEmits([
  "openModProfile",
  "clickFeedback",
  "clickUndoFeedback",
  "clickEditFeedback",
  "handleViewFeedback",
  "openReplyEditor",
  "hideReplyEditor",
  "hideEditCommentEditor",
  "saveEdit",
  "startCommentSave",
  "hideReplies",
  "showReplies",
  "updateNewComment",
  "createComment",
]);

const route = useRoute();
const router = useRouter();
const { result: localUsernameResult, loading: localUsernameLoading, error: localUsernameError } = useQuery(GET_LOCAL_USERNAME);
const username = computed(() => {
  if (localUsernameLoading.value || localUsernameError.value) {
    return "";
  }
  return localUsernameResult.value.username;
});

const loggedInUserIsAuthor = computed(() => {
  if (!props.commentData) {
    return false;
  }
  return props.commentData.CommentAuthor?.username === username.value;
});

const showEmojiPicker = ref(false);

function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value;
  if (showEmojiPicker.value) {
    emit("hideReplyEditor");
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
      @toggle-emoji-picker="toggleEmojiPicker"
    />
    <div class="flex flex-wrap items-center gap-1 text-xs text-gray-400 dark:text-gray-300">
      <VoteButtons
        v-if="!locked"
        :comment-data="commentData"
        :show-downvote="enableFeedback && !loggedInUserIsAuthor"
        @open-mod-profile="emit('openModProfile')"
        @click-feedback="emit('clickFeedback')"
        @click-undo-feedback="emit('clickUndoFeedback')"
        @click-edit-feedback="emit('clickEditFeedback')"
        @view-feedback="emit('handleViewFeedback')"
      />
      <NewEmojiButton
        :comment-id="commentData.id"
        @toggle-emoji-picker="toggleEmojiPicker"
      />
      <ReplyButton
        :show-reply-editor="!!replyFormOpenAtCommentID"
        :comment-data="commentData"
        :parent-comment-id="parentCommentId"
        :depth="depth"
        @click="emit('openReplyEditor', commentData.id)"
      />
      <span
        v-if="showEditCommentField"
        class="cursor-pointer underline hover:text-black dark:text-gray-300 dark:hover:text-white"
        @click="emit('hideEditCommentEditor')"
      >
        Cancel
      </span>
      <span
        v-if="showEditCommentField && !commentInProcess"
        class="cursor-pointer underline hover:text-black dark:text-gray-300 dark:hover:text-white"
        @click="
          () => {
            emit('saveEdit');
            emit('startCommentSave');
          }
        "
      >
        Save
      </span>
      <span
        v-if="showEditCommentField && commentInProcess"
        class="cursor-pointer underline hover:text-black dark:text-gray-300 dark:hover:text-white"
      >
        Saving...
      </span>
      <span
        v-if="commentData.DiscussionChannel"
        :to="`${route.path}/comments/${commentData.id}`"
        class="cursor-pointer underline hover:text-black dark:text-gray-300 dark:hover:text-white"
        @click="
          router.push({
            name: 'forums-forumId-discussions-discussionId-comment-commentId',
            params: {
              forumId: commentData.DiscussionChannel?.channelUniqueName,
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
        class="cursor-pointer underline hover:text-black dark:text-gray-300 dark:hover:text-white"
        @click="emit('hideReplies')"
      >
        {{ `Hide ${replyCount} ${replyCount === 1 ? "Reply" : "Replies"}` }}
      </span>
      <span
        v-if="!showReplies"
        class="cursor-pointer underline hover:text-black dark:text-gray-300 dark:hover:text-white"
        @click="emit('showReplies')"
      >
        {{ `Show ${replyCount} ${replyCount === 1 ? "Reply" : "Replies"}` }}
      </span>
      <slot />
    </div>

    <div
      v-if="commentData && replyFormOpenAtCommentID === commentData.id"
      class="my-2 mt-1 w-full px-3 py-4 dark:bg-gray-700"
    >
      <TextEditor
        :placeholder="'Please be kind'"
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
          :disabled="commentData?.text?.length === 0"
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

<script setup lang="ts">
  import { computed, ref } from "vue";
  import { useRoute } from "nuxt/app";
  import { useMutation } from "@vue/apollo-composable";
  import GenericModal from "@/components/GenericModal.vue";
  import TextEditor from "@/components/TextEditor.vue";
  import ArchiveBoxXMark from "../icons/ArchiveBoxXMark.vue";
  import {
    UNARCHIVE_DISCUSSION,
    UNARCHIVE_EVENT,
    UNARCHIVE_COMMENT,
  } from "@/graphQLData/issue/mutations";

  const props = defineProps({
    open: {
      type: Boolean,
      default: false,
    },
    commentId: {
      type: String,
      required: false,
      default: "",
    },
    discussionChannelId: {
      type: String,
      required: false,
      default: "",
    },
    eventChannelId: {
      type: String,
      required: false,
      default: "",
    },
    discussionId: {
      type: String,
      required: false,
      default: "",
    },
    eventId: {
      type: String,
      required: false,
      default: "",
    },
  });
  const emit = defineEmits(["close", "unarchivedSuccessfully"]);

  const route = useRoute();

  const channelId = computed(() => {
    return typeof route.params.forumId === "string" ? route.params.forumId : "";
  });

  const explanation = ref("No violation");

  const {
    mutate: unarchiveDiscussion,
    loading: unarchiveDiscussionLoading,
    error: unarchiveDiscussionError,
    onDone: unarchiveDiscussionDone,
  } = useMutation(UNARCHIVE_DISCUSSION, {
    update: (cache) => {
      // update the result of GET_DISCUSSION_CHANNEL_BY_ID
      // so that archived=false.

      if (!props.discussionChannelId) {
        console.error("No discussion channel ID provided.");
        return;
      }

      cache.modify({
        id: cache.identify({
          __typename: "DiscussionChannel",
          id: props.discussionChannelId,
        }),
        fields: {
          archived() {
            return false;
          },
        },
      });
    },
  });

  const {
    mutate: unarchiveEvent,
    loading: unarchiveEventLoading,
    error: unarchiveEventError,
    onDone: unarchiveEventDone,
  } = useMutation(UNARCHIVE_EVENT, {
    update: (cache) => {
      // update the result of GET_EVENT_CHANNEL_BY_ID
      // so that archived=false.

      if (!props.eventChannelId) {
        console.error("No event channel ID provided.");
        return;
      }

      cache.modify({
        id: cache.identify({
          __typename: "EventChannel",
          id: props.eventChannelId,
        }),
        fields: {
          archived() {
            return false;
          },
        },
      });
    },
  });

  const {
    mutate: unarchiveComment,
    loading: unarchiveCommentLoading,
    error: unarchiveCommentError,
    onDone: unarchiveCommentDone,
  } = useMutation(UNARCHIVE_COMMENT, {
    update: (cache) => {
      // update the result of GET_COMMENT_BY_ID
      // so that archived=false.

      if (!props.commentId) {
        console.error("No comment ID provided.");
        return;
      }

      cache.modify({
        id: cache.identify({
          __typename: "Comment",
          id: props.commentId,
        }),
        fields: {
          archived() {
            return false;
          },
        },
      });
    },
  });

  unarchiveDiscussionDone(() => {
    emit("unarchivedSuccessfully");
  });

  unarchiveEventDone(() => {
    emit("unarchivedSuccessfully");
  });

  unarchiveCommentDone(() => {
    emit("unarchivedSuccessfully");
  });

  const modalTitle = computed(() => {
    if (props.commentId) {
      return "Unarchive Comment";
    } else if (props.discussionId) {
      return "Unarchive Discussion";
    } else if (props.eventId) {
      return "Unarchive Event";
    }

    return "Unarchive Content";
  });

  const modalBody = computed(() => {
    let contentType = "discussion";
    if (props.commentId) {
      contentType = "comment";
    } else if (props.eventId) {
      contentType = "event";
    }
    return `(Optional) Please add any more information or context about why this ${contentType} should be unarchived.`;
  });

  const modalPlaceholder = computed(() => {
    let contentType = "discussion";
    if (props.commentId) {
      contentType = "comment";
    } else if (props.eventId) {
      contentType = "event";
    }
    return `Explain why this ${contentType} should be unarchived`;
  });

  const submit = async () => {
    if (!props.discussionId && !props.eventId && !props.commentId) {
      console.error("No discussion, event, or comment ID provided.");
      return;
    }

    if (props.commentId) {
      unarchiveComment({
        commentId: props.commentId,
        explanation: explanation.value,
      });
      return;
    }

    if (props.discussionId) {
      unarchiveDiscussion({
        discussionId: props.discussionId,
        explanation: explanation.value,
        channelUniqueName: channelId.value,
      });
    }

    if (props.eventId) {
      unarchiveEvent({
        eventId: props.eventId,
        explanation: explanation.value,
        channelUniqueName: channelId.value,
      });
    }
  };

  const close = () => {
    emit("close");
  };
</script>

<template>
  <GenericModal
    :body="modalBody"
    :data-testid="'unarchive-modal'"
    :error="
      unarchiveDiscussionError?.message ||
      unarchiveEventError?.message ||
      unarchiveCommentError?.message
    "
    :highlight-color="'green'"
    :loading="unarchiveDiscussionLoading || unarchiveEventLoading || unarchiveCommentLoading"
    :open="open"
    :primary-button-disabled="explanation.length === 0"
    :primary-button-text="'Unarchive'"
    :secondary-button-text="'Cancel'"
    :title="modalTitle"
    @close="close"
    @primary-button-click="submit"
  >
    <template #icon>
      <ArchiveBoxXMark
        aria-hidden="true"
        class="h-6 w-6 text-green-600 opacity-100 dark:text-green-400"
      />
    </template>
    <template #content>
      <TextEditor
        :allow-image-upload="false"
        :disable-auto-focus="false"
        :initial-value="explanation"
        :placeholder="modalPlaceholder"
        :test-id="'report-discussion-input'"
        @update="explanation = $event"
      />
      <ErrorBanner
        v-if="unarchiveDiscussionError || unarchiveEventError || unarchiveCommentError"
        :text="
          unarchiveDiscussionError?.message ||
          unarchiveEventError?.message ||
          unarchiveCommentError?.message
        "
      />
    </template>
  </GenericModal>
</template>

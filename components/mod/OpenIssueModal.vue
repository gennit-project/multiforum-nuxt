<script setup lang="ts">
import { computed, ref } from "vue";
import type { PropType } from "vue";
import { useRoute } from "nuxt/app";
import { useMutation } from "@vue/apollo-composable";
import GenericModal from "@/components/GenericModal.vue";
import FlagIcon from "@/components/icons/FlagIcon.vue";
import TextEditor from "@/components/TextEditor.vue";
import {
  REPORT_DISCUSSION,
  REPORT_EVENT,
  REPORT_COMMENT,
  ARCHIVE_DISCUSSION,
  ARCHIVE_EVENT,
  ARCHIVE_COMMENT,
} from "@/graphQLData/issue/mutations";
import type { Comment } from "@/__generated__/graphql";
import SelectBrokenRules from "@/components/admin/SelectBrokenRules.vue";

const props = defineProps({
  discussionTitle: {
    type: String,
    required: false,
    default: "",
  },
  eventTitle: {
    type: String,
    required: false,
    default: "",
  },
  commentId: {
    type: String,
    required: false,
    default: "",
  },
  comment: {
    type: Object as PropType<Comment | null | undefined>,
    required: false,
    default: null,
  },
  open: {
    type: Boolean,
    default: false,
  },
  archiveAfterReporting: {
    type: Boolean,
    default: false,
  },
  discussionChannelId: {
    type: String,
    required: false,
    default: "",
  },
});
const emit = defineEmits([
  "close",
  "reportSubmittedSuccessfully",
  "reportedAndArchivedSuccessfully",
]);

const route = useRoute();

const channelId = computed(() => {
  return typeof route.params.forumId === "string" ? route.params.forumId : "";
});

const discussionId = computed(() => {
  return typeof route.params.discussionId === "string"
    ? route.params.discussionId
    : "";
});

const eventId = computed(() => {
  return typeof route.params.eventId === "string" ? route.params.eventId : "";
});

const selectedForumRules = ref<string[]>([]);
const selectedServerRules = ref<string[]>([]);
const reportText = ref("");

const toggleForumRuleSelection = (rule: string) => {
  if (selectedForumRules.value.includes(rule)) {
    selectedForumRules.value = selectedForumRules.value.filter(
      (r) => r !== rule
    );
  } else {
    selectedForumRules.value = [...selectedForumRules.value, rule];
  }
};

const toggleServerRuleSelection = (rule: string) => {
  if (selectedServerRules.value.includes(rule)) {
    selectedServerRules.value = selectedServerRules.value.filter(
      (r) => r !== rule
    );
  } else {
    selectedServerRules.value = [...selectedServerRules.value, rule];
  }
};

const {
  mutate: reportDiscussion,
  loading: reportDiscussionLoading,
  error: reportDiscussionError,
  onDone: reportDiscussionDone,
} = useMutation(REPORT_DISCUSSION);

const {
  mutate: reportEvent,
  loading: reportEventLoading,
  error: reportEventError,
  onDone: reportEventDone,
} = useMutation(REPORT_EVENT);

const {
  mutate: reportComment,
  loading: reportCommentLoading,
  error: reportCommentError,
  onDone: reportCommentDone,
} = useMutation(REPORT_COMMENT);

const {
  mutate: archiveDiscussion,
  loading: archiveDiscussionLoading,
  error: archiveDiscussionError,
  onDone: archiveDiscussionDone,
} = useMutation(ARCHIVE_DISCUSSION, {
  update: (cache, { data }) => {
    // update the result of GET_DISCUSSION_CHANNEL_BY_ID
    // so that archived=true.

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
          return true;
        },
      },
    });
  },
});

const {
  mutate: archiveEvent,
  loading: archiveEventLoading,
  error: archiveEventError,
  onDone: archiveEventDone,
} = useMutation(ARCHIVE_EVENT);

const {
  mutate: archiveComment,
  loading: archiveCommentLoading,
  error: archiveCommentError,
  onDone: archiveCommentDone,
} = useMutation(ARCHIVE_COMMENT);

reportDiscussionDone(() => {
  reportText.value = "";
  emit("reportSubmittedSuccessfully");
});

reportEventDone(() => {
  reportText.value = "";
  emit("reportSubmittedSuccessfully");
});

reportCommentDone(() => {
  reportText.value = "";
  emit("reportSubmittedSuccessfully");
});

archiveDiscussionDone(() => {
  emit("reportedAndArchivedSuccessfully");
});

archiveEventDone(() => {
  emit("reportedAndArchivedSuccessfully");
});

archiveCommentDone(() => {
  emit("reportedAndArchivedSuccessfully");
});

const modalTitle = computed(() => {
  if (props.archiveAfterReporting) {
    if (props.commentId) {
      return "Archive Comment";
    } else if (discussionId.value) {
      return "Archive Discussion";
    } else if (eventId.value) {
      return "Archive Event";
    }
  } else {
    if (props.commentId) {
      return "Report Comment";
    } else if (discussionId.value) {
      return "Report Discussion";
    } else if (eventId.value) {
      return "Report Event";
    }
  }
  return "Report Content";
});

const modalBody = computed(() => {
  let contentType = "discussion";
  if (props.commentId) {
    contentType = "comment";
  } else if (eventId.value) {
    contentType = "event";
  }
  return `(Optional) Please add any more information or context about why this ${contentType} be removed.`;
});

const modalPlaceholder = computed(() => {
  let contentType = "discussion";
  if (props.commentId) {
    contentType = "comment";
  } else if (eventId.value) {
    contentType = "event";
  }
  return `Explain why this ${contentType} should be removed`;
});

const submit = async () => {
  if (!discussionId.value && !eventId.value && !props.commentId) {
    console.error("No discussion, event, or comment ID provided.");
    return;
  }
  if (!props.archiveAfterReporting) {
    if (discussionId.value) {
      reportDiscussion({
        discussionId: discussionId.value,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value,
      });
    }
    if (eventId.value) {
      reportEvent({
        eventId: eventId.value,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value,
      });
    }
    if (props.commentId) {
      reportComment({
        commentId: props.commentId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value,
      });
    }
  } else {
    // We don't have to call report mutations here because the reports
    // are already built into the archive resolvers.
    if (discussionId.value) {
      archiveDiscussion({
        discussionId: discussionId.value,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value,
      });
    }
    if (eventId.value) {
      archiveEvent({
        eventId: eventId.value,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value,
      });
    }
    if (props.commentId) {
      archiveComment({
        commentId: props.commentId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value,
      });
    }
  }
};

const close = () => {
  emit("close");
};
</script>

<template>
  <GenericModal
    :highlight-color="'red'"
    :title="modalTitle"
    :body="'Please select at least one broken rule:'"
    :open="open"
    :primary-button-text="'Submit'"
    :secondary-button-text="'Cancel'"
    :loading="
      reportDiscussionLoading ||
      reportEventLoading ||
      reportCommentLoading ||
      archiveDiscussionLoading ||
      archiveEventLoading ||
      archiveCommentLoading
    "
    :primary-button-disabled="
      selectedForumRules.length === 0 && selectedServerRules.length === 0
    "
    :error="
      reportDiscussionError?.message ||
      reportEventError?.message ||
      reportCommentError?.message ||
      archiveDiscussionError?.message ||
      archiveEventError?.message ||
      archiveCommentError?.message
    "
    @primary-button-click="submit"
    @close="close"
  >
    <template #icon>
      <FlagIcon
        class="h-6 w-6 text-red-600 opacity-100 dark:text-red-400"
        aria-hidden="true"
      />
    </template>
    <template #content>
      <SelectBrokenRules
        @toggle-forum-rule-selection="toggleForumRuleSelection"
        @toggle-server-rule-selection="toggleServerRuleSelection"
      />
      <h2 class="text-gray-500 dark:text-gray-400 text-sm mt-2">
        {{ modalBody }}
      </h2>
      <TextEditor
        :test-id="'report-discussion-input'"
        :initial-value="reportText"
        :placeholder="modalPlaceholder"
        :disable-auto-focus="false"
        :allow-image-upload="false"
        @update="reportText = $event"
      />
    </template>
  </GenericModal>
</template>

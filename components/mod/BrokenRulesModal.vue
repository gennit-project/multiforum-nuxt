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
import { SUSPEND_USER, SUSPEND_MOD } from "@/graphQLData/mod/mutations";
import type { Comment } from "@/__generated__/graphql";
import SelectBrokenRules from "@/components/admin/SelectBrokenRules.vue";
import ArchiveBox from "@/components/icons/ArchiveBox.vue";
import { IS_ORIGINAL_POSTER_SUSPENDED } from "@/graphQLData/mod/queries";

type FinalCommentTextInput = {
  selectedForumRules: string[];
  selectedServerRules: string[];
  reportText: string;
};

const props = defineProps({
  issueId: {
    type: String,
    required: false,
    default: "",
  },
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
  eventChannelId: {
    type: String,
    required: false,
    default: "",
  },
  suspendUserEnabled: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits([
  "close",
  "reportSubmittedSuccessfully",
  "reportedAndArchivedSuccessfully",
  "suspended-user-successfully",
  "suspended-mod-successfully",
]);

const route = useRoute();

const channelId = computed(() => {
  return typeof route.params.forumId === "string" ? route.params.forumId : "";
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
  mutate: suspendUser,
  loading: suspendUserLoading,
  error: suspendUserError,
  onDone: suspendUserDone,
} = useMutation(SUSPEND_USER, {
  update: (cache) => {
    // update the result of IS_ORIGINAL_POSTER_SUSPENDED
    // is true.
    cache.writeQuery({
      query: IS_ORIGINAL_POSTER_SUSPENDED,
      variables: {
        issueId: props.issueId,
      },
      data: {
        isOriginalPosterSuspended: true,
      },
    });
  },
});

const {
  mutate: suspendMod,
  loading: suspendModLoading,
  error: suspendModError,
  onDone: suspendModDone,
} = useMutation(SUSPEND_MOD, {
  update: (cache) => {
    // update the result of IS_ORIGINAL_POSTER_SUSPENDED
    // is true.
    cache.writeQuery({
      query: IS_ORIGINAL_POSTER_SUSPENDED,
      variables: {
        issueId: props.issueId,
      },
      data: {
        isOriginalPosterSuspended: true,
      },
    });
  },
});

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
  update: (cache) => {
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
} = useMutation(ARCHIVE_EVENT, {
  update: (cache) => {
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
          return true;
        },
      },
    });
  },
});

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

suspendUserDone(() => {
  emit("suspended-user-successfully");
});

suspendModDone(() => {
  emit("suspended-mod-successfully");
});

const modalTitle = computed(() => {
  if (props.archiveAfterReporting) {
    if (props.commentId) {
      return "Archive Comment";
    } else if (props.discussionId) {
      return "Archive Discussion";
    } else if (props.eventId) {
      return "Archive Event";
    }
  } else {
    if (props.commentId) {
      return "Report Comment";
    } else if (props.discussionId) {
      return "Report Discussion";
    } else if (props.eventId) {
      return "Report Event";
    }
  }
  return "Report Content";
});

const modalBody = computed(() => {
  let contentType = "discussion";
  if (props.commentId) {
    contentType = "comment";
  } else if (props.eventId) {
    contentType = "event";
  }
  return `(Optional) Please add any more information or context about why this ${contentType} should be removed.`;
});

const modalPlaceholder = computed(() => {
  let contentType = "discussion";
  if (props.commentId) {
    contentType = "comment";
  } else if (props.eventId) {
    contentType = "event";
  }
  return `Explain why this ${contentType} should be removed`;
});

const getFinalCommentText = (input: FinalCommentTextInput) => {
  const { selectedForumRules, selectedServerRules, reportText } = input;
  return `
${
  selectedForumRules.length > 0
    ? `
Server rule violations:

${selectedForumRules.map((rule) => `- ${rule}`).join("\n")}
`
    : ""
}

${
  selectedServerRules.length > 0
    ? `

Forum rule violations:

${selectedServerRules.map((rule) => `- ${rule}`).join("\n")}
`
    : ""
}

${
  reportText
    ? `
Notes:

${reportText}
`
    : ""
}
`;
};

const submit = async () => {
  if (!props.discussionId && !props.eventId && !props.commentId) {
    console.error("No discussion, event, or comment ID provided.");
    return;
  }
  if (props.suspendUserEnabled) {
    let issueId = props.issueId;
    if (!issueId) {
      // If an issue does not already exist, create one.
      if (props.discussionId) {
        const issue = await archiveDiscussion({
          discussionId: props.discussionId,
          reportText: reportText.value,
          selectedForumRules: selectedForumRules.value,
          selectedServerRules: selectedServerRules.value,
          channelUniqueName: channelId.value,
        });
        issueId = issue?.data?.archiveDiscussion?.id;
      }
      if (props.eventId) {
        const issue = await archiveEvent({
          eventId: props.eventId,
          reportText: reportText.value,
          selectedForumRules: selectedForumRules.value,
          selectedServerRules: selectedServerRules.value,
          channelUniqueName: channelId.value,
        });
        console.log('issue', issue);
        issueId = issue?.data?.archiveEvent?.id;
      }
      if (props.commentId) {
        const issue = await archiveComment({
          commentId: props.commentId,
          reportText: reportText.value,
          selectedForumRules: selectedForumRules.value,
          selectedServerRules: selectedServerRules.value,
          channelUniqueName: channelId.value,
        });
        issueId = issue?.data?.archiveComment?.id;
      }
    }
    if (!issueId) {
      console.error("Could not suspend the user without an issue ID.");
      return;
    }

    suspendUser({
      issueID: issueId,
      suspendUntil: null,
      suspendIndefinitely: true,
      explanation: getFinalCommentText({
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        reportText: reportText.value,
      }),
    });
  } else if (!props.archiveAfterReporting) {
    // Assume the user is reporting the content.
    if (props.discussionId) {
      reportDiscussion({
        discussionId: props.discussionId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value,
      });
    }
    if (props.eventId) {
      reportEvent({
        eventId: props.eventId,
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
    // Assume the user is archiving the content.
    // Note: Reports are already built into the archive resolvers.
    if (props.discussionId) {
      archiveDiscussion({
        discussionId: props.discussionId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value,
      });
    }
    if (props.eventId) {
      archiveEvent({
        eventId: props.eventId,
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
  // Clear the form

  selectedForumRules.value = [];
  selectedServerRules.value = [];
  reportText.value = "";

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
      archiveCommentLoading ||
      suspendUserLoading ||
      suspendModLoading
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
      archiveCommentError?.message ||
      suspendUserError?.message ||
      suspendModError?.message
    "
    @primary-button-click="submit"
    @close="close"
  >
    <template #icon>
      <FlagIcon
        v-if="!archiveAfterReporting"
        class="h-6 w-6 text-red-600 opacity-100 dark:text-red-400"
        aria-hidden="true"
      />
      <ArchiveBox
        v-else
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

<script setup lang="ts">
import { computed, ref } from "vue";
import type { PropType } from "vue";
import { useRoute } from "nuxt/app";
import { useMutation } from "@vue/apollo-composable";
import { DateTime } from "luxon";
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
import { SUSPEND_USER } from "@/graphQLData/mod/mutations";
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

// Holds the chosen suspension length if props.suspendUserEnabled is true
const suspensionLength = ref<"" | "two_weeks" | "one_month" | "indefinite">("");

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
} = useMutation(ARCHIVE_COMMENT, {
  update: (cache) => {
    cache.modify({
      id: cache.identify({
        __typename: "Comment",
        id: props.commentId,
      }),
      fields: {
        archived() {
          return true;
        },
      },
    });
  },
});

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

const contentType = computed(() => {
  if (props.commentId) {
    return "comment";
  } else if (props.discussionId) {
    return "discussion";
  } else if (props.eventId) {
    return "event";
  }
  return "";
});

const modalBody = computed(() => {
  return `(Optional) Please add any more information or context about why this ${contentType.value} should be removed.`;
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
    // Require a suspension length
    if (!suspensionLength.value) {
      console.error("A suspension length is required to suspend the user.");
      return;
    }

    let issueId = props.issueId;

    // Archive the issue first. This makes sure
    // that there is always an issue ID before the user is
    // suspended, and the content is always archived
    // before the user is suspended.

    if (props.discussionId) {
      const issue = await archiveDiscussion({
        discussionId: props.discussionId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value,
      });
      issueId = issue?.data?.archiveDiscussion?.id;
    } else if (props.eventId) {
      const issue = await archiveEvent({
        eventId: props.eventId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value,
      });
      issueId = issue?.data?.archiveEvent?.id;
    } else if (props.commentId) {
      const issue = await archiveComment({
        commentId: props.commentId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
      });
      issueId = issue?.data?.archiveComment?.id;
    }

    if (!issueId) {
      console.error("Could not suspend the user without an issue ID.");
      return;
    }

    // Figure out the suspendUntil date or indefinite
    let suspendUntil: string | null = null;
    let suspendIndefinitely = false;

    switch (suspensionLength.value) {
      case "two_weeks":
        suspendUntil = DateTime.now().plus({ weeks: 2 }).toISO();
        break;
      case "one_month":
        suspendUntil = DateTime.now().plus({ months: 1 }).toISO();
        break;
      case "indefinite":
        suspendIndefinitely = true;
        break;
    }

    suspendUser({
      issueID: issueId,
      suspendUntil,
      suspendIndefinitely,
      explanation: getFinalCommentText({
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        reportText: reportText.value,
      }),
    });
  } else if (!props.archiveAfterReporting) {
    // Standard "report" flow
    if (props.discussionId) {
      reportDiscussion({
        discussionId: props.discussionId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value,
      });
    } else if (props.eventId) {
      reportEvent({
        eventId: props.eventId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value,
      });
    } else if (props.commentId) {
      reportComment({
        commentId: props.commentId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value,
      });
    }
  } else {
    // "archive" flow (also includes a report)
    if (props.discussionId) {
      archiveDiscussion({
        discussionId: props.discussionId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value,
      });
    } else if (props.eventId) {
      archiveEvent({
        eventId: props.eventId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value,
      });
    } else if (props.commentId) {
      archiveComment({
        commentId: props.commentId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
      });
    }
  }
};

const close = () => {
  selectedForumRules.value = [];
  selectedServerRules.value = [];
  reportText.value = "";
  suspensionLength.value = "";
  emit("close");
};
</script>

<template>
  <GenericModal
    :data-testid="`report-${props.commentId ? 'comment' : props.discussionId ? 'discussion' : 'event'}-modal`"
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
      suspendUserLoading
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
      suspendUserError?.message
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
      <div v-if="suspendUserEnabled" class="mt-4">
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
          >Suspend user for</label
        >
        <select
          v-model="suspensionLength"
          class="block w-60 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
        >
          <option disabled value="">-- Select --</option>
          <option value="two_weeks">Two Weeks</option>
          <option value="one_month">One Month</option>
          <option value="indefinite">Indefinite</option>
        </select>
      </div>
      <h2 class="text-gray-500 dark:text-gray-400 text-sm mt-4">
        {{ modalBody }}
      </h2>
      <TextEditor
        :test-id="`report-${contentType}-input`"
        :initial-value="reportText"
        :placeholder="modalPlaceholder"
        :disable-auto-focus="false"
        :allow-image-upload="false"
        @update="reportText = $event"
      />
    </template>
  </GenericModal>
</template>

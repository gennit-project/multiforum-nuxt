<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PropType } from 'vue';
import { useRoute } from 'nuxt/app';
import { useApolloClient, useMutation } from '@vue/apollo-composable';
import { DateTime } from 'luxon';
import GenericModal from '@/components/GenericModal.vue';
import FlagIcon from '@/components/icons/FlagIcon.vue';
import TextEditor from '@/components/TextEditor.vue';
import {
  REPORT_DISCUSSION,
  REPORT_EVENT,
  REPORT_COMMENT,
  REPORT_IMAGE,
  REPORT_WIKI_EDIT,
  ARCHIVE_DISCUSSION,
  ARCHIVE_EVENT,
  ARCHIVE_COMMENT,
  ARCHIVE_IMAGE,
} from '@/graphQLData/issue/mutations';
import { GET_ISSUE } from '@/graphQLData/issue/queries';
import { SUSPEND_USER } from '@/graphQLData/mod/mutations';
import type { Comment } from '@/__generated__/graphql';
import SelectBrokenRules from '@/components/admin/SelectBrokenRules.vue';
import ArchiveBox from '@/components/icons/ArchiveBox.vue';
import { IS_ORIGINAL_POSTER_SUSPENDED } from '@/graphQLData/mod/queries';

type FinalCommentTextInput = {
  selectedForumRules: string[];
  selectedServerRules: string[];
  reportText: string;
};

const props = defineProps({
  issueId: {
    type: String,
    required: false,
    default: '',
  },
  discussionTitle: {
    type: String,
    required: false,
    default: '',
  },
  eventTitle: {
    type: String,
    required: false,
    default: '',
  },
  commentId: {
    type: String,
    required: false,
    default: '',
  },
  discussionId: {
    type: String,
    required: false,
    default: '',
  },
  eventId: {
    type: String,
    required: false,
    default: '',
  },
  imageId: {
    type: String,
    required: false,
    default: '',
  },
  wikiPageId: {
    type: String,
    required: false,
    default: '',
  },
  wikiRevisionId: {
    type: String,
    required: false,
    default: '',
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
    default: '',
  },
  eventChannelId: {
    type: String,
    required: false,
    default: '',
  },
  // Optional channel override - if provided, uses this instead of route params
  // Useful when reporting from contexts without channel in the URL (e.g., user profile)
  channelUniqueNameOverride: {
    type: String,
    required: false,
    default: '',
  },
  suspendUserEnabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'close',
  'reportSubmittedSuccessfully',
  'reportedAndArchivedSuccessfully',
  'suspended-user-successfully',
  'suspended-mod-successfully',
]);

const { client } = useApolloClient();

const route = useRoute();

const channelId = computed(() => {
  // Use override if provided, otherwise get from route
  if (props.channelUniqueNameOverride) {
    return props.channelUniqueNameOverride;
  }
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const selectedForumRules = ref<string[]>([]);
const selectedServerRules = ref<string[]>([]);
const reportText = ref('');

// Holds the chosen suspension length if props.suspendUserEnabled is true
const suspensionLength = ref<'' | 'two_weeks' | 'one_month' | 'indefinite'>('two_weeks');

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
  mutate: reportImage,
  loading: reportImageLoading,
  error: reportImageError,
  onDone: reportImageDone,
} = useMutation(REPORT_IMAGE);

const {
  mutate: reportWikiEdit,
  loading: reportWikiEditLoading,
  error: reportWikiEditError,
  onDone: reportWikiEditDone,
} = useMutation(REPORT_WIKI_EDIT);

const {
  mutate: archiveDiscussion,
  loading: archiveDiscussionLoading,
  error: archiveDiscussionError,
  onDone: archiveDiscussionDone,
} = useMutation(ARCHIVE_DISCUSSION, {
  update: (cache) => {
    if (!props.discussionChannelId) {
      console.error('No discussion channel ID provided.');
      return;
    }
    cache.modify({
      id: cache.identify({
        __typename: 'DiscussionChannel',
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
      console.error('No event channel ID provided.');
      return;
    }
    cache.modify({
      id: cache.identify({
        __typename: 'EventChannel',
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
        __typename: 'Comment',
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

const {
  mutate: archiveImage,
  loading: archiveImageLoading,
  error: archiveImageError,
  onDone: archiveImageDone,
} = useMutation(ARCHIVE_IMAGE, {
  update: (cache) => {
    cache.modify({
      id: cache.identify({
        __typename: 'Image',
        id: props.imageId,
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
  reportText.value = '';
  emit('reportSubmittedSuccessfully');
});

reportEventDone(() => {
  reportText.value = '';
  emit('reportSubmittedSuccessfully');
});

reportCommentDone(() => {
  reportText.value = '';
  emit('reportSubmittedSuccessfully');
});

reportImageDone(() => {
  reportText.value = '';
  emit('reportSubmittedSuccessfully');
});

reportWikiEditDone(() => {
  reportText.value = '';
  emit('reportSubmittedSuccessfully');
});

archiveDiscussionDone(() => {
  client.refetchQueries({
    include: [GET_ISSUE],
  });
  emit('reportedAndArchivedSuccessfully');
});

archiveEventDone(() => {
  client.refetchQueries({
    include: [GET_ISSUE],
  });
  emit('reportedAndArchivedSuccessfully');
});

archiveCommentDone(() => {
  client.refetchQueries({
    include: [GET_ISSUE],
  });
  emit('reportedAndArchivedSuccessfully');
});

archiveImageDone(() => {
  client.refetchQueries({
    include: [GET_ISSUE],
  });
  emit('reportedAndArchivedSuccessfully');
});

suspendUserDone(() => {
  client.refetchQueries({
    include: [GET_ISSUE],
  });
  emit('suspended-user-successfully');
});

const modalTitle = computed(() => {
  if (props.archiveAfterReporting) {
    if (props.commentId) {
      return 'Archive Comment';
    } else if (props.discussionId) {
      return 'Archive Discussion';
    } else if (props.eventId) {
      return 'Archive Event';
    } else if (props.imageId) {
      return 'Archive Image';
    }
  } else {
    if (props.commentId) {
      return 'Report Comment';
    } else if (props.discussionId) {
      return 'Report Discussion';
    } else if (props.eventId) {
      return 'Report Event';
    } else if (props.imageId) {
      return 'Report Image';
    } else if (props.wikiPageId) {
      return 'Report Wiki Edit';
    }
  }
  return 'Report Content';
});

const contentType = computed(() => {
  if (props.commentId) {
    return 'comment';
  } else if (props.discussionId) {
    return 'discussion';
  } else if (props.eventId) {
    return 'event';
  } else if (props.imageId) {
    return 'image';
  } else if (props.wikiPageId) {
    return 'wiki edit';
  }
  return '';
});

const modalBody = computed(() => {
  return `(Optional) Please add any more information or context about why this ${contentType.value} should be removed.`;
});

const modalPlaceholder = computed(() => {
  let type = 'discussion';
  if (props.commentId) {
    type = 'comment';
  } else if (props.eventId) {
    type = 'event';
  } else if (props.imageId) {
    type = 'image';
  } else if (props.wikiPageId) {
    type = 'wiki edit';
  }
  return `Explain why this ${type} should be removed`;
});

const getFinalCommentText = (input: FinalCommentTextInput) => {
  const { selectedForumRules, selectedServerRules, reportText } = input;
  return `
${
  selectedForumRules.length > 0
    ? `
Server rule violations:

${selectedForumRules.map((rule) => `- ${rule}`).join('\n')}
`
    : ''
}

${
  selectedServerRules.length > 0
    ? `
Forum rule violations:

${selectedServerRules.map((rule) => `- ${rule}`).join('\n')}
`
    : ''
}

${
  reportText
    ? `
Notes:

${reportText}
`
    : ''
}
`;
};
const submit = async () => {
  if (
    !props.discussionId &&
    !props.eventId &&
    !props.commentId &&
    !props.imageId &&
    !props.wikiPageId
  ) {
    console.error('No discussion, event, comment, image, or wiki page ID provided.');
    return;
  }

  if (props.suspendUserEnabled) {
    // Require a suspension length
    if (!suspensionLength.value) {
      console.error('A suspension length is required to suspend the user.');
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
    } else if (props.imageId) {
      const issue = await archiveImage({
        imageId: props.imageId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value || null,
      });
      issueId = issue?.data?.archiveImage?.id;
    }

    if (!issueId) {
      console.error('Could not suspend the user without an issue ID.');
      return;
    }

    // Figure out the suspendUntil date or indefinite
    let suspendUntil: string | null = null;
    let suspendIndefinitely = false;

    switch (suspensionLength.value) {
      case 'two_weeks':
        suspendUntil = DateTime.now().plus({ weeks: 2 }).toISO();
        break;
      case 'one_month':
        suspendUntil = DateTime.now().plus({ months: 1 }).toISO();
        break;
      case 'indefinite':
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
    } else if (props.imageId) {
      reportImage({
        imageId: props.imageId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value || null,
      });
    } else if (props.wikiPageId) {
      reportWikiEdit({
        wikiPageId: props.wikiPageId,
        wikiRevisionId: props.wikiRevisionId || null,
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
    } else if (props.imageId) {
      archiveImage({
        imageId: props.imageId,
        reportText: reportText.value,
        selectedForumRules: selectedForumRules.value,
        selectedServerRules: selectedServerRules.value,
        channelUniqueName: channelId.value || null,
      });
    }
  }
};

const close = () => {
  selectedForumRules.value = [];
  selectedServerRules.value = [];
  reportText.value = '';
  suspensionLength.value = 'two_weeks';
  emit('close');
};
</script>

<template>
  <GenericModal
    :data-testid="`report-${props.commentId ? 'comment' : props.discussionId ? 'discussion' : props.imageId ? 'image' : 'event'}-modal`"
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
      reportImageLoading ||
      reportWikiEditLoading ||
      archiveDiscussionLoading ||
      archiveEventLoading ||
      archiveCommentLoading ||
      archiveImageLoading ||
      suspendUserLoading
    "
    :primary-button-disabled="
      selectedForumRules.length === 0 && selectedServerRules.length === 0
    "
    :error="
      reportDiscussionError?.message ||
      reportEventError?.message ||
      reportCommentError?.message ||
      reportImageError?.message ||
      reportWikiEditError?.message ||
      archiveDiscussionError?.message ||
      archiveEventError?.message ||
      archiveCommentError?.message ||
      archiveImageError?.message ||
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
          class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
          >Suspend user for</label
        >
        <select
          v-model="suspensionLength"
          class="block w-60 rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          <option disabled value="">-- Select --</option>
          <option value="two_weeks">Two Weeks</option>
          <option value="one_month">One Month</option>
          <option value="indefinite">Indefinite</option>
        </select>
      </div>
      <h2 class="mt-4 text-sm text-gray-500 dark:text-gray-400">
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

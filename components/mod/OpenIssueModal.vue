<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useMutation, useQuery } from '@vue/apollo-composable';
import GenericModal from '@/components/GenericModal.vue';
import FlagIcon from '@/components/icons/FlagIcon.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import TextEditor from '@/components/TextEditor.vue';
import {
  REPORT_CONTENT,
  REOPEN_ISSUE,
  ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT,
} from '@/graphQLData/issue/mutations';
import {
  CHECK_DISCUSSION_ISSUE_EXISTENCE,
  CHECK_EVENT_ISSUE_EXISTENCE,
  CHECK_COMMENT_ISSUE_EXISTENCE,
  GET_ISSUES_BY_CHANNEL,
} from '@/graphQLData/issue/queries';
import { GET_LOCAL_MOD_PROFILE_NAME } from '@/graphQLData/user/queries';
import { COUNT_OPEN_ISSUES } from '@/graphQLData/mod/queries';
import type { IssueCreateInput, Comment } from '@/__generated__/graphql';

type UpdateIssueInCacheInput = {
  cache: any;
  result: any;
  channelId: string;
};

const emit = defineEmits(['close', 'reportSubmittedSuccessfully']);

const updateIssueInCache = (input: UpdateIssueInCacheInput) => {
  const { cache, result, channelId } = input;
  const resultIssues = result?.data?.createIssues?.issues;
  const activeIssue = resultIssues[0];

  const existingOpenIssuesData = cache.readQuery({
    query: COUNT_OPEN_ISSUES,
    variables: { channelUniqueName: channelId },
  });

  if (
    existingOpenIssuesData &&
    existingOpenIssuesData.issuesAggregate
  ) {
    const existingOpenIssues = existingOpenIssuesData.issuesAggregate;
    const newOpenIssues = {
      count: existingOpenIssues.count + 1,
    };

    cache.writeQuery({
      query: COUNT_OPEN_ISSUES,
      variables: { channelUniqueName: channelId },
      data: {
        issuesAggregate: {
          ...existingOpenIssues,
          ...newOpenIssues,
        },
      },
    });
  }

  const existingIssuesByChannelData = cache.readQuery({
    query: GET_ISSUES_BY_CHANNEL,
    variables: { channelUniqueName: channelId },
  });

  if (
    existingIssuesByChannelData &&
    existingIssuesByChannelData.channels
  ) {
    const existingIssuesByChannel = existingIssuesByChannelData.channels[0];
    const newIssuesByChannel = {
      ...existingIssuesByChannel,
      Issues: [...existingIssuesByChannel.Issues, activeIssue.value],
    };

    cache.writeQuery({
      query: GET_ISSUES_BY_CHANNEL,
      variables: { channelUniqueName: channelId },
      data: {
        channels: [newIssuesByChannel],
      },
    });
  }
};

const props = defineProps({
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
  comment: {
    type: Object as PropType<Comment | null | undefined>,
    required: false,
    default: null,
  },
  open: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();

const channelId = computed(() => {
  return typeof route.params.channelId === 'string' ? route.params.channelId : '';
});

const discussionId = computed(() => {
  return typeof route.params.discussionId === 'string' ? route.params.discussionId : '';
});

const eventId = computed(() => {
  return typeof route.params.eventId === 'string' ? route.params.eventId : '';
});

const {
  result: localModProfileNameResult,
  loading: localModProfileNameLoading,
  error: localModProfileNameError,
} = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

const loggedInUserModName = computed(() => {
  return localModProfileNameLoading.value || localModProfileNameError.value
    ? ''
    : localModProfileNameResult.value.modProfileName;
});

const {
  load: checkDiscussionIssueExistence,
  result: discussionIssueExistenceResult,
} = useLazyQuery(
  CHECK_DISCUSSION_ISSUE_EXISTENCE,
  {
    discussionId: discussionId.value,
    channelUniqueName: channelId.value,
  },
  {
    fetchPolicy: 'network-only',
  }
);

const {
  load: checkEventIssueExistence,
  result: eventIssueExistenceResult,
} = useLazyQuery(
  CHECK_EVENT_ISSUE_EXISTENCE,
  {
    eventId: eventId.value,
    channelUniqueName: channelId.value,
  },
  {
    fetchPolicy: 'network-only',
  }
);

const {
  load: checkCommentIssueExistence,
  result: commentIssueExistenceResult,
} = useLazyQuery(
  CHECK_COMMENT_ISSUE_EXISTENCE,
  {
    commentId: props.commentId,
    channelUniqueName: channelId.value,
  },
  {
    fetchPolicy: 'network-only',
  }
);

const { mutate: reopenIssue } = useMutation(REOPEN_ISSUE);

const reportText = ref('');

const {
  mutate: addIssueActivityFeedItem,
  loading: addIssueActivityFeedItemLoading,
  onDone: addIssueActivityFeedItemDone,
} = useMutation(ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT);

addIssueActivityFeedItemDone(() => {
  emit('reportSubmittedSuccessfully');
});

const {
  mutate: reportContent,
  error: reportContentError,
  loading: reportContentLoading,
  onDone: reportContentDone,
} = useMutation(REPORT_CONTENT, () => ({
  update: (cache: any, result: any) => {
    updateIssueInCache({
      cache,
      result,
      channelId: channelId.value,
    });
  },
}));

reportContentDone(() => {
  reportText.value = '';
  emit('reportSubmittedSuccessfully');
});

const modalTitle = computed(() => {
  if (props.commentId) {
    return 'Report Comment';
  } else if (discussionId.value) {
    return 'Report Discussion';
  } else if (eventId.value) {
    return 'Report Event';
  }
  return 'Report Content';
});

const modalBody = computed(() => {
  let contentType = 'discussion';
  if (props.commentId) {
    contentType = 'comment';
  } else if (eventId.value) {
    contentType = 'event';
  }
  return `Why should this ${contentType} be removed? Please be specific about any rule violations.`;
});

const modalPlaceholder = computed(() => {
  let contentType = 'discussion';
  if (props.commentId) {
    contentType = 'comment';
  } else if (eventId.value) {
    contentType = 'event';
  }
  return `Explain why this ${contentType} should be removed`;
});

const modActionDescription = computed(() => {
  if (props.commentId) {
    return 'reported the comment';
  } else if (discussionId.value) {
    return 'reported the discussion';
  } else if (eventId.value) {
    return 'reported the event';
  }
  return 'reported the content';
});

const submit = async () => {
  if (!discussionId.value && !eventId.value && !props.commentId) {
    console.error('No discussion, event, or comment ID provided.');
    return;
  }

  let existingIssueId = '';

  if (props.commentId) {
    await checkCommentIssueExistence();
    if (commentIssueExistenceResult.value.issues?.length > 0) {
      existingIssueId = commentIssueExistenceResult.value.issues[0].id || '';
    }
  } else if (discussionId.value) {
    await checkDiscussionIssueExistence();
    if (discussionIssueExistenceResult.value.issues?.length > 0) {
      existingIssueId = discussionIssueExistenceResult.value.issues[0].id || '';
    }
  } else if (eventId.value) {
    await checkEventIssueExistence();
    if (eventIssueExistenceResult.value.issues?.length > 0) {
      existingIssueId = eventIssueExistenceResult.value.issues[0].id || '';
    }
  }

  if (existingIssueId) {
    addIssueActivityFeedItem({
      issueId: existingIssueId,
      displayName: loggedInUserModName.value,
      actionDescription: 'reported the discussion',
      actionType: 'report',
      commentText: reportText.value,
    });

    if (existingIssueId) {
      reopenIssue({
        id: existingIssueId,
      });
    }

    return;
  }

  const issueCreateInput: IssueCreateInput = {
    title: getIssueTitle(),
    isOpen: true,
    authorName: loggedInUserModName.value,
    Author: {
      ModerationProfile: {
        connect: {
          where: {
            node: {
              displayName: loggedInUserModName.value,
            },
          },
        },
      },
    },
    channelUniqueName: channelId.value,
    Channel: {
      connect: {
        where: {
          node: {
            uniqueName: channelId.value,
          },
        },
      },
    },
    ActivityFeed: {
      create: {
        node: {
          ModerationProfile: {
            connect: {
              where: {
                node: {
                  displayName: loggedInUserModName.value,
                },
              },
            },
          },
          actionType: 'report',
          actionDescription: modActionDescription.value,
          Comment: {
            create: {
              node: {
                text: reportText.value,
                isRootComment: true,
                CommentAuthor: {
                  ModerationProfile: {
                    connect: {
                      where: {
                        node: {
                          displayName: loggedInUserModName.value,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  if (props.commentId) {
    issueCreateInput.relatedCommentId = props.commentId;
  } else if (discussionId.value) {
    issueCreateInput.relatedDiscussionId = discussionId.value;
  } else if (eventId.value) {
    issueCreateInput.relatedEventId = eventId.value;
  }

  await reportContent({
    input: [issueCreateInput],
  });
};

const close = () => {
  emit('close');
};

const getIssueTitle = () => {
  if (props.commentId) {
    const truncatedCommentText =
      props.comment?.text?.length && props.comment.text.length > 50
        ? props.comment?.text?.substring(0, 50) + '...'
        : props.comment?.text;
    return `Reported Comment: "${truncatedCommentText || ''}"`;
  }
  if (discussionId.value) {
    return `Reported Discussion: "${props.discussionTitle}"`;
  }
  if (eventId.value) {
    return `Reported Event: "${props.eventTitle}"`;
  }
};

</script>

<template>
  <GenericModal
    :highlight-color="'red'"
    :title="modalTitle"
    :body="modalBody"
    :open="open"
    :primary-button-text="'Submit'"
    :secondary-button-text="'Cancel'"
    :loading="reportContentLoading || addIssueActivityFeedItemLoading"
    :primary-button-disabled="!reportText"
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
      <TextEditor
        :test-id="'report-discussion-input'"
        :initial-value="reportText"
        :placeholder="modalPlaceholder"
        :disable-auto-focus="false"
        :allow-image-upload="false"
        @update="reportText = $event"
      />
      <ErrorBanner
        v-if="reportContentError"
        :text="reportContentError.message"
      />
    </template>
  </GenericModal>
</template>

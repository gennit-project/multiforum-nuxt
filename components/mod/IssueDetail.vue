<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { hasBotMention } from '@/utils/botMentions';
import {
  GET_CLOSED_ISSUES_BY_CHANNEL,
  GET_ISSUE,
  GET_ISSUES_BY_CHANNEL,
} from '@/graphQLData/issue/queries';
import {
  CLOSE_ISSUE,
  REOPEN_ISSUE,
  ADD_ISSUE_ACTIVITY_FEED_ITEM,
  ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD,
  ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_USER,
  UPDATE_ISSUE,
  LOCK_ISSUE,
  UNLOCK_ISSUE,
} from '@/graphQLData/issue/mutations';
import { DELETE_DISCUSSION } from '@/graphQLData/discussion/mutations';
import { GET_DISCUSSION } from '@/graphQLData/discussion/queries';
import { DELETE_EVENT } from '@/graphQLData/event/mutations';
import { DELETE_COMMENT } from '@/graphQLData/comment/mutations';
import {
  COUNT_CLOSED_ISSUES,
  COUNT_OPEN_ISSUES,
} from '@/graphQLData/mod/queries';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { DateTime } from 'luxon';
import type { Issue as GeneratedIssue } from '@/__generated__/graphql';
import ErrorBanner from '@/components/ErrorBanner.vue';
import 'md-editor-v3/lib/style.css';
import PageNotFound from '@/components/PageNotFound.vue';
import DiscussionDetails from '@/components/mod/DiscussionDetails.vue';
import EventDetail from '@/components/event/detail/EventDetail.vue';
import CommentDetails from '@/components/mod/CommentDetails.vue';
import ModerationWizard from '@/components/mod/ModerationWizard.vue';
import OriginalPosterActions from '@/components/mod/OriginalPosterActions.vue';
import ActivityFeed from '@/components/mod/ActivityFeed.vue';
import { modProfileNameVar, usernameVar } from '@/cache';
import { useRoute } from 'nuxt/app';
import XCircleIcon from '../icons/XCircleIcon.vue';
import ArrowPathIcon from '../icons/ArrowPath.vue';
import FlagIcon from '../icons/FlagIcon.vue';
import MarkdownPreview from '../MarkdownPreview.vue';
import { getAllPermissions } from '@/utils/permissionUtils';
import { config } from '@/config';
import {
  isCurrentUserOriginalPoster as isOriginalPoster,
  getIssueActionVisibility,
  getOriginalPoster,
} from '@/utils/originalPoster';

type Issue = GeneratedIssue & {
  issueNumber: number;
  locked?: boolean;
  lockedAt?: string;
  lockReason?: string;
  LockedBy?: { displayName?: string };
};

// Setup
const route = useRoute();

// Route and issueNumber computations
const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const issueNumber = computed(() => {
  const value = route.params.issueNumber;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
});

// Fetch issue data
const {
  result: getIssueResult,
  error: getIssueError,
  loading: getIssueLoading,
  refetch: refetchIssue,
} = useQuery(
  GET_ISSUE,
  () => ({
    channelUniqueName: channelId.value,
    issueNumber: issueNumber.value,
  }),
  () => ({
    enabled: issueNumber.value !== null,
  })
);

// Setup a query to get channel data (we'll use this for refetching after actions)
const { result: getChannelResult, refetch: refetchChannel } = useQuery(
  GET_CHANNEL,
  () => ({
    uniqueName: channelId.value,
    now: DateTime.local().startOf('hour').toISO(),
  }),
  () => ({
    fetchPolicy: 'cache-first',
    enabled: !!channelId.value,
  })
);

const { result: getServerResult } = useQuery(GET_SERVER_CONFIG, {
  serverName: config.serverName,
});

const activeIssue = computed<Issue | null>(() => {
  if (getIssueError.value || !getIssueResult.value) return null;
  return getIssueResult.value.issues[0];
});

const activeIssueId = computed(() => activeIssue.value?.id || '');
const relatedDiscussionId = computed(
  () => activeIssue.value?.relatedDiscussionId || ''
);

const { result: relatedDiscussionResult } = useQuery(
  GET_DISCUSSION,
  () => ({
    id: relatedDiscussionId.value,
    loggedInModName: modProfileNameVar.value,
    channelUniqueName: channelId.value,
  }),
  () => ({
    fetchPolicy: 'cache-first',
    enabled: !!relatedDiscussionId.value,
  })
);

const relatedDiscussion = computed(() => {
  return relatedDiscussionResult.value?.discussions?.[0] ?? null;
});

const isIssueAuthor = computed(() => {
  const author = activeIssue.value?.Author;
  if (!author) return false;

  if (author.__typename === 'User') {
    return !!usernameVar.value && author.username === usernameVar.value;
  }

  if (author.__typename === 'ModerationProfile') {
    return (
      !!modProfileNameVar.value &&
      author.displayName === modProfileNameVar.value
    );
  }

  return false;
});

const isLocked = computed(() => activeIssue.value?.locked === true);

const lockReasonInput = ref('');
const showLockDialog = ref(false);

const standardModRole = computed(() => {
  if (getChannelResult.value?.channels?.[0]?.DefaultModRole) {
    return getChannelResult.value.channels[0].DefaultModRole;
  }
  if (getServerResult.value?.serverConfigs?.[0]?.DefaultModRole) {
    return getServerResult.value.serverConfigs[0].DefaultModRole;
  }
  return null;
});

const elevatedModRole = computed(() => {
  if (getChannelResult.value?.channels?.[0]?.ElevatedModRole) {
    return getChannelResult.value.channels[0].ElevatedModRole;
  }
  if (getServerResult.value?.serverConfigs?.[0]?.DefaultElevatedModRole) {
    return getServerResult.value.serverConfigs[0].DefaultElevatedModRole;
  }
  return null;
});

const permissionData = computed(() => {
  if (getChannelResult.value?.channels?.[0]) {
    return getChannelResult.value.channels[0];
  }
  return null;
});

const modPermissions = computed(() => {
  return getAllPermissions({
    permissionData: permissionData.value,
    standardModRole: standardModRole.value,
    elevatedModRole: elevatedModRole.value,
    username: usernameVar.value,
    modProfileName: modProfileNameVar.value,
  });
});

const isSuspendedMod = computed(() => {
  return modPermissions.value.isSuspendedMod;
});

const authorType = computed(() => {
  if (originalModProfileName.value) return 'mod';
  if (originalAuthorUsername.value) return 'user';
  return 'user';
});

const isEditingIssueBody = ref(false);
const editedIssueBody = ref('');

watch(
  () => activeIssue.value?.body,
  (newBody) => {
    editedIssueBody.value = newBody || '';
  },
  { immediate: true }
);

const {
  mutate: updateIssueBody,
  loading: updateIssueBodyLoading,
  error: updateIssueBodyError,
} = useMutation(UPDATE_ISSUE, () => ({
  variables: {
    issueWhere: { id: activeIssueId.value },
    updateIssueInput: { body: editedIssueBody.value },
  },
}));

const issueBodyHasChanges = computed(() => {
  return (editedIssueBody.value || '') !== (activeIssue.value?.body || '');
});

const startIssueBodyEdit = () => {
  if (!isIssueAuthor.value || isLocked.value) return;
  editedIssueBody.value = activeIssue.value?.body || '';
  isEditingIssueBody.value = true;
};

const cancelIssueBodyEdit = () => {
  editedIssueBody.value = activeIssue.value?.body || '';
  isEditingIssueBody.value = false;
};

const saveIssueBody = async () => {
  if (!activeIssue.value) return;
  if (!editedIssueBody.value.trim()) return;

  if (!issueBodyHasChanges.value) {
    isEditingIssueBody.value = false;
    return;
  }

  try {
    await updateIssueBody();
    await refetchIssue();
    isEditingIssueBody.value = false;
  } catch (error) {
    console.error('Error updating issue body', error);
  }
};

const { mutate: closeIssue, loading: closeIssueLoading } = useMutation(
  CLOSE_ISSUE,
  () => ({
    variables: {
      id: activeIssueId.value,
    },
    update(cache) {
      // Get the issue in the cache by ID, then edit it so the isOpen field is false.
      cache.modify({
        id: cache.identify({
          __typename: 'Issue',
          id: activeIssueId.value,
        }),
        fields: {
          isOpen() {
            return false;
          },
        },
      });

      // update the result of COUNT_CLOSED_ISSUES
      // to increment the count of closed issues
      const existingClosedIssuesData = cache.readQuery({
        query: COUNT_CLOSED_ISSUES,
        variables: { channelUniqueName: channelId.value },
      });

      if (
        existingClosedIssuesData &&
        // @ts-ignore
        existingClosedIssuesData.issuesAggregate
      ) {
        // @ts-ignore
        const existingClosedIssues = existingClosedIssuesData.issuesAggregate;
        const newClosedIssues = {
          count: existingClosedIssues.count + 1,
        };

        cache.writeQuery({
          query: COUNT_CLOSED_ISSUES,
          variables: { channelUniqueName: channelId.value },
          data: {
            issuesAggregate: newClosedIssues,
          },
        });
      }

      // Also update the result of COUNT_OPEN_ISSUES
      // to decrement the count of open issues
      const existingOpenIssuesData = cache.readQuery({
        query: COUNT_OPEN_ISSUES,
        variables: { channelUniqueName: channelId.value },
      });

      if (
        existingOpenIssuesData &&
        // @ts-ignore
        existingOpenIssuesData.issuesAggregate
      ) {
        // @ts-ignore
        const existingOpenIssues = existingOpenIssuesData.issuesAggregate;
        const newOpenIssues = {
          count: existingOpenIssues.count - 1,
        };

        cache.writeQuery({
          query: COUNT_OPEN_ISSUES,
          variables: { channelUniqueName: channelId.value },
          data: {
            issuesAggregate: newOpenIssues,
          },
        });
      }

      // Also update the result of GET_ISSUES_BY_CHANNEL
      // to remove this issue from the list of open issues
      const existingIssuesByChannelData = cache.readQuery({
        query: GET_ISSUES_BY_CHANNEL,
        variables: { channelUniqueName: channelId.value, searchInput: '' },
      });

      if (
        existingIssuesByChannelData &&
        // @ts-ignore
        existingIssuesByChannelData.channels
      ) {
        // @ts-ignore
        const existingIssuesByChannel = existingIssuesByChannelData.channels[0];
        const newIssuesByChannel = {
          ...existingIssuesByChannel,
          Issues: existingIssuesByChannel.Issues.filter(
            (issue: Issue) => issue.id !== activeIssueId.value
          ),
        };

        cache.writeQuery({
          query: GET_ISSUES_BY_CHANNEL,
          variables: { channelUniqueName: channelId.value, searchInput: '' },
          data: {
            channels: [newIssuesByChannel],
          },
        });
      }

      // Also update the result of GET_CLOSED_ISSUES_BY_CHANNEL
      // to add this issue to the list of closed issues
      const existingClosedIssuesByChannelData: {
        channels?: { Issues: Issue[] }[];
      } | null = cache.readQuery({
        query: GET_CLOSED_ISSUES_BY_CHANNEL,
        variables: { channelUniqueName: channelId.value },
      });

      if (
        existingClosedIssuesByChannelData &&
        // @ts-ignore
        existingClosedIssuesByChannelData.channels
      ) {
        // @ts-ignore
        const existingClosedIssuesByChannel =
          existingClosedIssuesByChannelData.channels[0];
        const newClosedIssuesByChannel = {
          ...existingClosedIssuesByChannel,
          Issues: [
            ...(existingClosedIssuesByChannel?.Issues || []),
            activeIssue.value,
          ],
        };

        cache.writeQuery({
          query: GET_CLOSED_ISSUES_BY_CHANNEL,
          variables: { channelUniqueName: channelId.value },
          data: {
            channels: [newClosedIssuesByChannel],
          },
        });
      }
    },
  })
);

const { mutate: reopenIssue, loading: reopenIssueLoading } = useMutation(
  REOPEN_ISSUE,
  () => ({
    variables: {
      id: activeIssueId.value,
    },
    update(cache) {
      // Get the issue in the cache by ID, then edit it so the isOpen field is true.
      cache.modify({
        id: cache.identify({
          __typename: 'Issue',
          id: activeIssueId.value,
        }),
        fields: {
          isOpen() {
            return true;
          },
        },
      });
      // update the result of COUNT_CLOSED_ISSUES
      // to decrement the count of closed issues
      const existingClosedIssuesData = cache.readQuery({
        query: COUNT_CLOSED_ISSUES,
        variables: { channelUniqueName: channelId.value },
      });

      if (
        existingClosedIssuesData &&
        // @ts-ignore
        existingClosedIssuesData.issuesAggregate
      ) {
        // @ts-ignore
        const existingClosedIssues = existingClosedIssuesData.issuesAggregate;
        const newClosedIssues = {
          count: existingClosedIssues.count - 1,
        };

        cache.writeQuery({
          query: COUNT_CLOSED_ISSUES,
          variables: { channelUniqueName: channelId.value },
          data: {
            issuesAggregate: newClosedIssues,
          },
        });
      }

      // Also update the result of COUNT_OPEN_ISSUES
      // to increment the count of open issues
      const existingOpenIssuesData = cache.readQuery({
        query: COUNT_OPEN_ISSUES,
        variables: { channelUniqueName: channelId.value },
      });

      if (
        existingOpenIssuesData &&
        // @ts-ignore
        existingOpenIssuesData.issuesAggregate
      ) {
        // @ts-ignore
        const existingOpenIssues = existingOpenIssuesData.issuesAggregate;
        const newOpenIssues = {
          count: existingOpenIssues.count + 1,
        };

        cache.writeQuery({
          query: COUNT_OPEN_ISSUES,
          variables: { channelUniqueName: channelId.value },
          data: {
            issuesAggregate: newOpenIssues,
          },
        });
      }

      // Also update the result of GET_CLOSED_ISSUES_BY_CHANNEL
      // so that the newly reopened issue is removed from the list
      // of closed issues.
      const existingClosedIssuesByChannelData: {
        channels?: { Issues: Issue[] }[];
      } | null = cache.readQuery({
        query: GET_CLOSED_ISSUES_BY_CHANNEL,
        variables: { channelUniqueName: channelId.value },
      });

      if (
        existingClosedIssuesByChannelData &&
        // @ts-ignore
        existingClosedIssuesByChannelData.channels
      ) {
        // @ts-ignore
        const existingClosedIssuesByChannel =
          existingClosedIssuesByChannelData.channels[0];
        const newClosedIssuesByChannel = {
          ...existingClosedIssuesByChannel,
          Issues: (existingClosedIssuesByChannel?.Issues || []).filter(
            (issue: Issue) => issue.id !== activeIssueId.value
          ),
        };

        cache.writeQuery({
          query: GET_CLOSED_ISSUES_BY_CHANNEL,
          variables: { channelUniqueName: channelId.value },
          data: {
            channels: [newClosedIssuesByChannel],
          },
        });
      }

      // Also update the result of GET_ISSUES_BY_CHANNEL
      // to add this issue to the list of open issues
      const existingIssuesByChannelData = cache.readQuery({
        query: GET_ISSUES_BY_CHANNEL,
        variables: { channelUniqueName: channelId.value, searchInput: '' },
      });

      if (
        existingIssuesByChannelData &&
        // @ts-ignore
        existingIssuesByChannelData.channels
      ) {
        // @ts-ignore
        const existingIssuesByChannel = existingIssuesByChannelData.channels[0];
        const newIssuesByChannel = {
          ...existingIssuesByChannel,
          Issues: [...existingIssuesByChannel.Issues, activeIssue.value],
        };

        cache.writeQuery({
          query: GET_ISSUES_BY_CHANNEL,
          variables: { channelUniqueName: channelId.value, searchInput: '' },
          data: {
            channels: [newIssuesByChannel],
          },
        });
      }
    },
  })
);

const { mutate: addIssueActivityFeedItem } = useMutation(
  ADD_ISSUE_ACTIVITY_FEED_ITEM,
  {
    update: (cache, { data: { updateIssues } }) => {
      const { issues } = updateIssues;
      const updatedIssue: Issue = issues[0];

      // Attempt to read the existing issues from the cache
      const existingIssueData = cache.readQuery({
        query: GET_ISSUE,
        variables: {
          channelUniqueName: updatedIssue.channelUniqueName || channelId.value,
          issueNumber: updatedIssue.issueNumber,
        },
      });

      if (
        existingIssueData &&
        // @ts-ignore
        existingIssueData.issues &&
        // @ts-ignore
        existingIssueData.issues.length > 0
      ) {
        // @ts-ignore
        const existingIssues: Issue[] = existingIssueData.issues;

        const newIssues = existingIssues.map((issue) =>
          issue.id === updatedIssue.id ? updatedIssue : issue
        );

        cache.writeQuery({
          query: GET_ISSUE,
          variables: {
            channelUniqueName:
              updatedIssue.channelUniqueName || channelId.value,
            issueNumber: updatedIssue.issueNumber,
          },
          data: {
            issues: newIssues,
          },
        });
      }
    },
  }
);

const {
  mutate: addIssueActivityFeedItemWithCommentAsMod,
  loading: addIssueActivityFeedItemWithCommentAsModLoading,
  error: addIssueActivityFeedItemWithCommentAsModError,
} = useMutation(ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD, {
  update: (cache, { data: { updateIssues } }) => {
    const { issues } = updateIssues;
    const updatedIssue: Issue = issues[0];

    // Attempt to read the existing issues from the cache
    const existingIssueData = cache.readQuery({
      query: GET_ISSUE,
      variables: {
        channelUniqueName: updatedIssue.channelUniqueName || channelId.value,
        issueNumber: updatedIssue.issueNumber,
      },
    });

    if (
      existingIssueData &&
      // @ts-ignore
      existingIssueData.issues &&
      // @ts-ignore
      existingIssueData.issues.length > 0
    ) {
      // @ts-ignore
      const existingIssues: Issue[] = existingIssueData.issues;

      const newIssues = existingIssues.map((issue) =>
        issue.id === updatedIssue.id ? updatedIssue : issue
      );

      cache.writeQuery({
        query: GET_ISSUE,
        variables: {
          channelUniqueName: updatedIssue.channelUniqueName || channelId.value,
          issueNumber: updatedIssue.issueNumber,
        },
        data: {
          issues: newIssues,
        },
      });
    }
  },
});

const {
  mutate: addIssueActivityFeedItemWithCommentAsUser,
  loading: addIssueActivityFeedItemWithCommentAsUserLoading,
  error: addIssueActivityFeedItemWithCommentAsUserError,
} = useMutation(ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_USER, {
  update: (cache, { data: { updateIssues } }) => {
    const { issues } = updateIssues;
    const updatedIssue: Issue = issues[0];

    // Attempt to read the existing issues from the cache
    const existingIssueData = cache.readQuery({
      query: GET_ISSUE,
      variables: {
        channelUniqueName: updatedIssue.channelUniqueName || channelId.value,
        issueNumber: updatedIssue.issueNumber,
      },
    });

    if (
      existingIssueData &&
      // @ts-ignore
      existingIssueData.issues &&
      // @ts-ignore
      existingIssueData.issues.length > 0
    ) {
      // @ts-ignore
      const existingIssues: Issue[] = existingIssueData.issues;

      const newIssues = existingIssues.map((issue) =>
        issue.id === updatedIssue.id ? updatedIssue : issue
      );

      cache.writeQuery({
        query: GET_ISSUE,
        variables: {
          channelUniqueName: updatedIssue.channelUniqueName || channelId.value,
          issueNumber: updatedIssue.issueNumber,
        },
        data: {
          issues: newIssues,
        },
      });
    }
  },
});

const { mutate: deleteDiscussion } = useMutation(DELETE_DISCUSSION);

const { mutate: deleteEvent } = useMutation(DELETE_EVENT);

const { mutate: deleteComment } = useMutation(DELETE_COMMENT);

const {
  mutate: lockIssueMutation,
  loading: lockIssueLoading,
  error: lockIssueError,
} = useMutation(LOCK_ISSUE, () => ({
  variables: {
    issueId: activeIssueId.value,
    reason: lockReasonInput.value,
  },
}));

const {
  mutate: unlockIssueMutation,
  loading: unlockIssueLoading,
  error: unlockIssueError,
} = useMutation(UNLOCK_ISSUE, () => ({
  variables: {
    issueId: activeIssueId.value,
    reason: null,
  },
}));

const handleLockIssue = async () => {
  if (!activeIssue.value || !lockReasonInput.value.trim()) return;
  if (isSuspendedMod.value) return;

  try {
    await lockIssueMutation();
    await refetchIssue();
    showLockDialog.value = false;
    lockReasonInput.value = '';
  } catch (error) {
    console.error('Error locking issue:', error);
  }
};

const handleUnlockIssue = async () => {
  if (!activeIssue.value) return;
  if (isSuspendedMod.value) return;

  try {
    await unlockIssueMutation();
    await refetchIssue();
  } catch (error) {
    console.error('Error unlocking issue:', error);
  }
};

const openLockDialog = () => {
  lockReasonInput.value = '';
  showLockDialog.value = true;
};

const closeLockDialog = () => {
  showLockDialog.value = false;
  lockReasonInput.value = '';
};

const closeOpenButtonText = computed(() => {
  if (activeIssue.value?.isOpen)
    return createFormValues.value.text ? 'Close with comment' : 'Close issue';
  return createFormValues.value.text ? 'Reopen with comment' : 'Reopen issue';
});

// Form values for creating comments
const createCommentDefaultValues = { text: '', isRootComment: true, depth: 1 };
const createFormValues = ref(createCommentDefaultValues);
const botMentionsBlocked = computed(() =>
  hasBotMention(createFormValues.value.text)
);
const deleteReasonError = ref('');

const issue = computed<Issue | null>(
  () => getIssueResult.value?.issues[0] || null
);

const hasRelatedContent = computed(() => {
  return (
    !!activeIssue.value?.relatedDiscussionId ||
    !!activeIssue.value?.relatedEventId ||
    !!activeIssue.value?.relatedCommentId
  );
});

const reportCount = computed(() => {
  const count = activeIssue.value?.ActivityFeedAggregate?.count;
  return typeof count === 'number' ? count : null;
});

const reportCountLabel = computed(() => {
  if (reportCount.value === null) return '';
  return `${reportCount.value} ${reportCount.value === 1 ? 'report' : 'reports'}`;
});

const shouldShowIssueDetailsSection = computed(() => {
  return (
    hasRelatedContent.value || !!activeIssue.value?.body || isIssueAuthor.value
  );
});

// Get the username of the original author of the reported content
const originalAuthorUsername = ref('');

// Get the mod profile name of the original author, if applicable
const originalModProfileName = ref('');

const setOriginalAuthorUsername = (username: string) => {
  if (username) {
    originalAuthorUsername.value = username;
  }
};

const setOriginalModProfileName = (modProfileName: string) => {
  if (modProfileName) {
    originalModProfileName.value = modProfileName;
  }
};

watch(
  () => relatedDiscussion.value?.Author?.username,
  (_username) => {
    const author = getOriginalPoster({ Discussion: relatedDiscussion.value });
    if (author.username) {
      setOriginalAuthorUsername(author.username);
    }
  },
  { immediate: true }
);

watch(
  () => activeIssue.value,
  (currentIssue) => {
    if (!currentIssue || hasRelatedContent.value) return;

    if (
      !originalAuthorUsername.value &&
      currentIssue.Author?.__typename === 'User'
    ) {
      setOriginalAuthorUsername(currentIssue.Author.username || '');
    }

    if (
      !originalModProfileName.value &&
      currentIssue.Author?.__typename === 'ModerationProfile'
    ) {
      setOriginalModProfileName(currentIssue.Author.displayName || '');
    }
  },
  { immediate: true }
);

// Determine if the current user is the original author via username
const isOriginalUserAuthor = computed(() => {
  return (
    !!usernameVar.value && originalAuthorUsername.value === usernameVar.value
  );
});

// Determine if the current user is the original author via mod profile
const isOriginalModAuthor = computed(() => {
  return (
    !!modProfileNameVar.value &&
    originalModProfileName.value === modProfileNameVar.value
  );
});

// Determine if the current user is the original poster (either as user or mod)
const isCurrentUserOriginalPoster = computed(() => {
  return isOriginalPoster({
    originalAuthorUsername: originalAuthorUsername.value,
    originalModProfileName: originalModProfileName.value,
    currentUsername: usernameVar.value,
    currentModProfileName: modProfileNameVar.value,
  });
});

const issueActionVisibility = computed(() => {
  return getIssueActionVisibility({
    hasRelatedContent: hasRelatedContent.value,
    isOriginalPoster: isCurrentUserOriginalPoster.value,
  });
});

const updateComment = (text: string) => {
  createFormValues.value.text = text;
};

const handleCreateComment = async () => {
  if (!activeIssue.value) return;
  if (isSuspendedMod.value && !isOriginalUserAuthor.value) {
    return;
  }

  // Case 1: Current user is the original author who posted as a regular user
  if (isOriginalUserAuthor.value) {
    await addIssueActivityFeedItemWithCommentAsUser({
      issueId: activeIssue.value.id,
      commentText: createFormValues.value.text,
      username: usernameVar.value,
      actionDescription: 'commented on the issue',
      actionType: 'comment',
      channelUniqueName: channelId.value,
    });
  }
  // Case 2: Current user is the original author who posted as a mod
  else if (isOriginalModAuthor.value) {
    if (!modProfileNameVar.value) return;
    await addIssueActivityFeedItemWithCommentAsMod({
      issueId: activeIssue.value.id,
      commentText: createFormValues.value.text,
      displayName: modProfileNameVar.value,
      actionDescription: 'commented on the issue',
      actionType: 'comment',
      channelUniqueName: channelId.value,
    });
  }
  // Case 3: Current user is not the original author - comment as mod
  else {
    if (!modProfileNameVar.value) return;
    await addIssueActivityFeedItemWithCommentAsMod({
      issueId: activeIssue.value.id,
      commentText: createFormValues.value.text,
      displayName: modProfileNameVar.value,
      actionDescription: 'commented on the issue',
      actionType: 'comment',
      channelUniqueName: channelId.value,
    });
  }

  createFormValues.value.text = '';
};

const toggleCloseOpenIssue = async () => {
  if (!activeIssue.value || !modProfileNameVar.value) return;
  if (isSuspendedMod.value) return;

  try {
    if (activeIssue.value.isOpen) {
      // Close the issue
      await closeIssue();

      if (createFormValues.value.text) {
        await addIssueActivityFeedItemWithCommentAsMod({
          issueId: activeIssue.value.id,
          displayName: modProfileNameVar.value,
          actionDescription: 'closed the issue',
          actionType: 'close',
          commentText: createFormValues.value.text,
          channelUniqueName: channelId.value,
        });
      } else {
        await addIssueActivityFeedItem({
          issueId: activeIssue.value.id,
          displayName: modProfileNameVar.value,
          actionDescription: 'closed the issue',
          actionType: 'close',
        });
      }
    } else {
      // Reopen the issue
      await reopenIssue();

      if (createFormValues.value.text) {
        await addIssueActivityFeedItemWithCommentAsMod({
          issueId: activeIssue.value.id,
          displayName: modProfileNameVar.value,
          actionDescription: 'reopened the issue',
          actionType: 'reopen',
          commentText: createFormValues.value.text,
          channelUniqueName: channelId.value,
        });
      } else {
        await addIssueActivityFeedItem({
          issueId: activeIssue.value.id,
          displayName: modProfileNameVar.value,
          actionDescription: 'reopened the issue',
          actionType: 'reopen',
        });
      }
    }

    // Refetch channel data to update issue counts in the UI
    // This is important for updating the IssuesAggregate count in ChannelTabs
    try {
      await refetchChannel();
      console.log('Refetched channel data to update issue counts');
    } catch (error) {
      console.error('Error refetching channel data:', error);
    }

    // Reset comment form
    createFormValues.value.text = '';
  } catch (error) {
    console.error('Error toggling issue open/close state:', error);
  }
};

const resolveDeleteReason = () => {
  const trimmedReason = createFormValues.value.text.trim();
  return trimmedReason || 'No reason provided.';
};

const requireDeleteReasonIfNotOp = () => {
  deleteReasonError.value = '';
  if (isCurrentUserOriginalPoster.value) {
    return true;
  }
  if (!createFormValues.value.text.trim()) {
    deleteReasonError.value = 'Please provide a reason before deleting.';
    return false;
  }
  return true;
};

// Handle delete actions from Original Poster Actions
const handleDeleteDiscussion = async (discussionId: string) => {
  if (!discussionId) return;
  if (!requireDeleteReasonIfNotOp()) return;

  try {
    if (modProfileNameVar.value && activeIssue.value) {
      if (activeIssue.value.isOpen) {
        await closeIssue();
      }

      await addIssueActivityFeedItemWithCommentAsMod({
        issueId: activeIssue.value.id,
        displayName: modProfileNameVar.value,
        actionDescription: 'deleted the discussion',
        actionType: 'delete',
        commentText: resolveDeleteReason(),
        channelUniqueName: channelId.value,
      });
    }

    await deleteDiscussion({ id: discussionId });
    createFormValues.value.text = '';
    deleteReasonError.value = '';
    await refetchIssue();
  } catch (error) {
    console.error('Error deleting discussion:', error);
  }
};

const handleDeleteEvent = async (eventId: string) => {
  if (!eventId) return;
  if (!requireDeleteReasonIfNotOp()) return;

  try {
    if (modProfileNameVar.value && activeIssue.value) {
      if (activeIssue.value.isOpen) {
        await closeIssue();
      }

      await addIssueActivityFeedItemWithCommentAsMod({
        issueId: activeIssue.value.id,
        displayName: modProfileNameVar.value,
        actionDescription: 'deleted the event',
        actionType: 'delete',
        commentText: resolveDeleteReason(),
        channelUniqueName: channelId.value,
      });
    }

    await deleteEvent({ id: eventId });
    createFormValues.value.text = '';
    deleteReasonError.value = '';
    await refetchIssue();
  } catch (error) {
    console.error('Error deleting event:', error);
  }
};

const handleDeleteComment = async (commentId: string) => {
  if (!commentId) return;
  if (!requireDeleteReasonIfNotOp()) return;

  try {
    if (modProfileNameVar.value && activeIssue.value) {
      if (activeIssue.value.isOpen) {
        await closeIssue();
      }

      await addIssueActivityFeedItemWithCommentAsMod({
        issueId: activeIssue.value.id,
        displayName: modProfileNameVar.value,
        actionDescription: 'deleted the comment',
        actionType: 'delete',
        commentText: resolveDeleteReason(),
        channelUniqueName: channelId.value,
      });
    }

    await deleteComment({ id: commentId });
    createFormValues.value.text = '';
    deleteReasonError.value = '';
    await refetchIssue();
  } catch (error) {
    console.error('Error deleting comment:', error);
  }
};
</script>

<template>
  <PageNotFound v-if="!getIssueLoading && !activeIssue" />
  <div
    v-else
    class="mx-1 my-4 flex-1 space-y-2 rounded-lg bg-white py-2 shadow-lg ring-1 ring-gray-200 dark:bg-gray-900 dark:text-white dark:ring-gray-700"
  >
    <ErrorBanner
      v-if="getIssueError"
      class="mt-2 px-4"
      :text="getIssueError.message"
    />
    <!-- Lock Status Banner -->
    <div
      v-if="isLocked"
      class="mx-4 mt-2 rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-600 dark:bg-yellow-900/30"
    >
      <div class="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 text-yellow-600 dark:text-yellow-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clip-rule="evenodd"
          />
        </svg>
        <span class="font-medium text-yellow-800 dark:text-yellow-200"
          >This issue is locked</span
        >
      </div>
      <p
        v-if="activeIssue?.lockReason"
        class="mt-1 text-sm text-yellow-700 dark:text-yellow-300"
      >
        <span class="font-medium">Reason:</span> {{ activeIssue.lockReason }}
      </p>
      <p class="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
        Locked by {{ activeIssue?.LockedBy?.displayName || 'Unknown' }}
        <span v-if="activeIssue?.lockedAt">
          on
          {{
            DateTime.fromISO(activeIssue.lockedAt).toLocaleString(
              DateTime.DATETIME_MED
            )
          }}
        </span>
      </p>
    </div>
    <div v-if="activeIssue" class="mt-2 flex flex-col gap-2 px-4">
      <div v-if="hasRelatedContent" class="flex items-center justify-between">
        <h2 class="text-xl font-bold">
          {{
            `Original ${
              activeIssue?.relatedDiscussionId
                ? 'discussion'
                : activeIssue?.relatedEventId
                  ? 'event'
                  : 'comment'
            }`
          }}
        </h2>
        <div
          v-if="reportCount !== null"
          :class="[
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium',
            reportCount > 0
              ? 'bg-red-200 text-red-800 dark:bg-red-900/70 dark:text-red-100'
              : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
          ]"
        >
          <FlagIcon class="h-4 w-4" aria-hidden="true" />
          {{ reportCountLabel }}
        </div>
      </div>
      <div
        v-if="shouldShowIssueDetailsSection"
        id="original-post-container"
        class="bg-blue-50 rounded-lg border border-l-4 border-blue-200 border-l-blue-400 px-4 py-2 dark:border-gray-600 dark:border-l-blue-500 dark:bg-gray-800"
      >
        <DiscussionDetails
          v-if="activeIssue?.relatedDiscussionId"
          :active-issue="activeIssue"
          @fetched-original-author-username="setOriginalAuthorUsername($event)"
        />
        <ClientOnly>
          <EventDetail
            v-if="activeIssue?.relatedEventId"
            :issue-event-id="activeIssue.relatedEventId"
            :show-comments="false"
            :show-menu-buttons="false"
            :username-on-top="true"
            :show-add-to-calendar="false"
            :show-event-in-past-banner="false"
            :show-title="true"
            @fetched-original-poster-username="setOriginalAuthorUsername($event)"
          />
        </ClientOnly>
        <CommentDetails
          v-if="activeIssue?.relatedCommentId"
          :comment-id="activeIssue.relatedCommentId"
          @fetched-original-author-username="setOriginalAuthorUsername($event)"
          @fetched-original-mod-profile-name="setOriginalModProfileName($event)"
        />
        <div v-if="activeIssue?.body || isIssueAuthor" class="py-2">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h3 class="font-semibold text-lg">Issue details</h3>
            <div v-if="isIssueAuthor && !isLocked" class="flex items-center gap-2">
              <GenericButton
                v-if="!isEditingIssueBody"
                :text="'Edit'"
                @click="startIssueBodyEdit"
              />
              <template v-else>
                <GenericButton :text="'Cancel'" @click="cancelIssueBodyEdit" />
                <SaveButton
                  :label="'Save'"
                  :disabled="
                    updateIssueBodyLoading ||
                    !editedIssueBody.trim() ||
                    !issueBodyHasChanges
                  "
                  :loading="updateIssueBodyLoading"
                  @click="saveIssueBody"
                />
              </template>
            </div>
          </div>
          <MarkdownPreview
            v-if="activeIssue?.body && !isEditingIssueBody"
            :text="activeIssue.body"
            :word-limit="1000"
            :disable-gallery="true"
          />
          <div v-else-if="isEditingIssueBody" class="space-y-2">
            <TextEditor
              :key="`issue-body-editor-${activeIssue?.id}`"
              :rows="6"
              :placeholder="'Update the issue details...'"
              :initial-value="editedIssueBody"
              @update="editedIssueBody = $event"
            />
          </div>
          <ErrorBanner
            v-if="updateIssueBodyError"
            class="mt-2"
            :text="updateIssueBodyError.message"
          />
        </div>
      </div>
    </div>

    <v-row v-if="issue" class="flex justify-center dark:text-white">
      <v-col>
        <div class="px-4">
          <h2 v-if="activeIssue" class="text-xl font-bold">Activity Feed</h2>

          <ActivityFeed
            v-if="activeIssue"
            :key="activeIssue.id"
            class="mb-6 border-l-4 border-l-blue-400 pl-4 dark:border-l-blue-500"
            :feed-items="activeIssue.ActivityFeed || []"
            :original-user-author-username="originalAuthorUsername"
            :original-mod-author-name="originalModProfileName"
            :related-discussion="relatedDiscussion"
          />

          <ErrorBanner
            v-if="addIssueActivityFeedItemWithCommentAsModError"
            :text="addIssueActivityFeedItemWithCommentAsModError.message"
          />
          <ErrorBanner
            v-if="addIssueActivityFeedItemWithCommentAsUserError"
            :text="addIssueActivityFeedItemWithCommentAsUserError.message"
          />
          <ErrorBanner v-if="deleteReasonError" :text="deleteReasonError" />
            <ModerationWizard
              v-if="
              issue &&
              issueActionVisibility.showModActions
            "
            :issue="issue"
            :discussion-id="activeIssue?.relatedDiscussionId || ''"
            :event-id="activeIssue?.relatedEventId || ''"
            :comment-id="activeIssue?.relatedCommentId || ''"
            :channel-unique-name="channelId"
            :close-issue-loading="closeIssueLoading"
            :is-current-user-original-poster="!issueActionVisibility.modActionsEnabled"
            :author-type="authorType"
            :is-suspended-mod="isSuspendedMod"
            :can-edit-comments="modPermissions.canEditComments"
            :can-edit-discussions="modPermissions.canEditDiscussions"
            :can-edit-events="modPermissions.canEditEvents"
            @archived-successfully="refetchIssue"
            @unarchived-successfully="refetchIssue"
            @suspended-user-successfully="refetchIssue"
            @suspended-mod-successfully="refetchIssue"
            @unsuspended-user-successfully="refetchIssue"
            @unsuspended-mod-successfully="refetchIssue"
            @open-issue="toggleCloseOpenIssue"
            @close-issue="toggleCloseOpenIssue"
          />
          <OriginalPosterActions
            v-if="
              issue &&
              issueActionVisibility.showOpActions
            "
            :issue="issue"
            :discussion-id="activeIssue?.relatedDiscussionId || ''"
            :event-id="activeIssue?.relatedEventId || ''"
            :comment-id="activeIssue?.relatedCommentId || ''"
            :channel-unique-name="channelId"
            :is-current-user-original-poster="isCurrentUserOriginalPoster"
            :actions-disabled="!issueActionVisibility.opActionsEnabled"
            @delete-discussion="handleDeleteDiscussion"
            @delete-event="handleDeleteEvent"
            @delete-comment="handleDeleteComment"
          />
          <div class="flex w-full flex-col">
            <h2 v-if="activeIssue" class="mt-8 border-b pb-1 text-xl font-bold">
              Leave a comment
            </h2>
            <ErrorBanner
              v-if="botMentionsBlocked"
              class="mt-2"
              :text="'Bot mentions are only available in discussion comments.'"
            />
            <TextEditor
              :key="`${createFormValues.text === ''}`"
              :test-id="'texteditor-textarea'"
              :disable-auto-focus="false"
              :placeholder="'Please be kind'"
              :initial-value="createFormValues.text"
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
                @click="openLockDialog"
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
                @click="handleUnlockIssue"
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
                  isSuspendedMod ||
                  closeIssueLoading ||
                  reopenIssueLoading ||
                  isLocked
                "
                @click="toggleCloseOpenIssue"
              >
                <XCircleIcon v-if="issue.isOpen" />
                <ArrowPathIcon v-else />
              </GenericButton>
              <SaveButton
                :data-testid="'createCommentButton'"
                :label="'Comment'"
                :disabled="
                  createFormValues.text.length === 0 ||
                  (isSuspendedMod && !isOriginalUserAuthor) ||
                  botMentionsBlocked ||
                  isLocked
                "
                :loading="
                  addIssueActivityFeedItemWithCommentAsModLoading ||
                  addIssueActivityFeedItemWithCommentAsUserLoading
                "
                @click.prevent="handleCreateComment"
              />
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Lock Issue Dialog -->
    <div
      v-if="showLockDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="closeLockDialog"
    >
      <div
        class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <h3 class="mb-4 text-lg font-bold dark:text-white">Lock Issue</h3>
        <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Locking an issue prevents further modifications including comments,
          status changes, and edits.
        </p>
        <label class="mb-2 block text-sm font-medium dark:text-gray-300">
          Reason for locking (required)
        </label>
        <textarea
          v-model="lockReasonInput"
          class="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          rows="3"
          placeholder="Enter the reason for locking this issue..."
        />
        <div class="mt-4 flex justify-end gap-2">
          <GenericButton :text="'Cancel'" @click="closeLockDialog" />
          <SaveButton
            :label="'Lock Issue'"
            :disabled="!lockReasonInput.trim() || lockIssueLoading"
            :loading="lockIssueLoading"
            @click="handleLockIssue"
          />
        </div>
      </div>
    </div>
  </div>
</template>

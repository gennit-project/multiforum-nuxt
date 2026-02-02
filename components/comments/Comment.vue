<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import type { PropType } from 'vue';
import type { ApolloError, Reference } from '@apollo/client/core';
import { gql } from '@apollo/client/core';
import type { Comment } from '@/__generated__/graphql';
import type { CreateReplyInputData } from '@/types/Comment';
import type { MenuItemType } from '@/components/IconButtonDropdown.vue';
import TextEditor from '../TextEditor.vue';
import ChildComments from './ChildComments.vue';
import CommentButtons from './CommentButtons.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import EllipsisHorizontal from '@/components/icons/EllipsisHorizontal.vue';
import RightArrowIcon from '@/components/icons/RightArrowIcon.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import CommentHeader from './CommentHeader.vue';
import { ALLOWED_ICONS } from '@/utils';
import { usernameVar, modProfileNameVar } from '@/cache';
import { MAX_CHARS_IN_COMMENT } from '@/utils/constants';
import { getFeedbackPermalinkObject } from '@/utils/routerUtils';
import type { BotSuggestion } from '@/utils/botMentions';
import { getAllPermissions } from '@/utils/permissionUtils';
import ArchivedCommentText from './ArchivedCommentText.vue';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { USER_IS_MOD_OR_OWNER_IN_CHANNEL } from '@/graphQLData/user/queries';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import {
  MARK_AS_ANSWERED_BY_COMMENT,
  UNMARK_COMMENT_AS_ANSWER,
} from '@/graphQLData/discussion/mutations';
import { DateTime } from 'luxon';
import { config } from '@/config';
import { useQuery, useMutation } from '@vue/apollo-composable';

const MAX_COMMENT_DEPTH = 5;
const SHOW_MORE_THRESHOLD = 1000;

type DeleteCommentInputData = {
  commentId: string;
  parentCommentId: string;
  replyCount: number;
};

export type HandleFeedbackInput = {
  commentData: Comment;
  parentCommentId: string;
};

export type HandleEditFeedbackInput = {
  commentData: Comment;
};

const props = defineProps({
  commentData: {
    type: Object as PropType<Comment>,
    required: true,
  },
  commentInProcess: {
    type: Boolean,
    default: false,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  depth: {
    type: Number,
    required: true,
  },
  editCommentError: {
    type: Object as PropType<ApolloError | null>,
    required: false,
    default: null,
  },
  editFormOpenAtCommentID: {
    type: String,
    default: '',
  },
  enableFeedback: {
    type: Boolean,
    default: true,
  },
  goToPermalinkOnClick: {
    type: Boolean,
    default: false,
  },
  isPermalinked: {
    type: Boolean,
    default: false,
  },
  locked: {
    type: Boolean,
    default: false,
  },
  modProfileName: {
    type: String,
    required: false,
    default: '',
  },
  parentCommentId: {
    type: String,
    default: '',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  replyFormOpenAtCommentID: {
    type: String,
    default: '',
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  showChannel: {
    type: Boolean,
    default: false,
  },
  showCommentButtons: {
    type: Boolean,
    default: true,
  },
  showContextLink: {
    type: Boolean,
    default: false,
  },
  originalPoster: {
    type: String,
    required: false,
    default: '',
  },
  lengthOfCommentInProgress: {
    type: Number,
    default: 1,
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
  showLabel: {
    type: Boolean,
    default: false,
  },
  answers: {
    type: Array as PropType<Comment[]>,
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

const route = useRoute();
const router = useRouter();
const { discussionId, eventId, issueNumber } = route.params;

const forumId = computed(() => {
  if (props.commentData?.Channel?.uniqueName) {
    return props.commentData.Channel.uniqueName;
  }
  if (props.commentData?.DiscussionChannel?.channelUniqueName) {
    return props.commentData.DiscussionChannel.channelUniqueName;
  }
  if (props.commentData?.Event?.EventChannels?.[0]?.channelUniqueName) {
    return props.commentData.Event.EventChannels[0].channelUniqueName;
  }
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return '';
});

const { result: getChannelResult } = useQuery(
  GET_CHANNEL,
  {
    uniqueName: forumId,
    // Using luxon, round down to the nearest hour
    now: DateTime.local().startOf('hour').toISO(),
  },
  {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  }
);

const { result: getServerResult } = useQuery(
  GET_SERVER_CONFIG,
  {
    serverName: config.serverName,
  },
  {
    fetchPolicy: 'cache-first',
  }
);

const standardModRole = computed(() => {
  // If the channel has a Default Mod Role, return that.
  if (getChannelResult.value?.channels[0]?.DefaultModRole) {
    return getChannelResult.value?.channels[0]?.DefaultModRole;
  }
  // Otherwise, return the default mod role from the server config.
  if (getServerResult.value?.serverConfigs[0]?.DefaultModRole) {
    return getServerResult.value?.serverConfigs[0]?.DefaultModRole;
  }
  return null;
});

const elevatedModRole = computed(() => {
  // If the channel has a Default Elevated Mod Role, return that.
  if (getChannelResult.value?.channels[0]?.ElevatedModRole) {
    return getChannelResult.value?.channels[0]?.ElevatedModRole;
  }
  // Otherwise, return the default elevated mod role from the server config.
  if (getServerResult.value?.serverConfigs[0]?.DefaultElevatedModRole) {
    return getServerResult.value?.serverConfigs[0]?.DefaultElevatedModRole;
  }
  return null;
});

const { result: getPermissionResult } = useQuery(
  USER_IS_MOD_OR_OWNER_IN_CHANNEL,
  {
    modDisplayName: modProfileNameVar.value,
    username: usernameVar.value,
    channelUniqueName: forumId.value || '',
  },
  {
    enabled:
      !!modProfileNameVar.value && !!usernameVar.value && !!forumId.value,
    fetchPolicy: 'cache-first',
  }
);

// Mutations for marking comments as best answers
const { mutate: markAsAnsweredByComment } = useMutation(
  MARK_AS_ANSWERED_BY_COMMENT,
  {
    update: (cache, { data }) => {
      // The mutation response contains the updated discussionChannel with new Answers array
      if (data?.updateDiscussionChannels?.discussionChannels?.[0]) {
        const updatedChannel =
          data.updateDiscussionChannels.discussionChannels[0];

        // Update any cached queries that might contain this data
        cache.modify({
          fields: {
            discussionChannels(existingChannels = [], { readField }) {
              return existingChannels.map((channelRef: Reference) => {
                const channelId = readField('id', channelRef);
                if (channelId === updatedChannel.id) {
                  cache.writeFragment({
                    id: cache.identify(channelRef),
                    fragment: gql`
                      fragment UpdatedAnswers on DiscussionChannel {
                        id
                        answered
                        Answers {
                          id
                          text
                          CommentAuthor {
                            ... on User {
                              username
                            }
                            ... on ModerationProfile {
                              displayName
                            }
                          }
                        }
                      }
                    `,
                    data: updatedChannel,
                  });
                }
                return channelRef;
              });
            },
          },
        });
      }
    },
  }
);

const { mutate: unmarkCommentAsAnswer } = useMutation(
  UNMARK_COMMENT_AS_ANSWER,
  {
    update: (cache, { data }) => {
      // The mutation response contains the updated discussionChannel with new Answers array
      if (data?.updateDiscussionChannels?.discussionChannels?.[0]) {
        const updatedChannel =
          data.updateDiscussionChannels.discussionChannels[0];

        // Update any cached queries that might contain this data
        // This will trigger reactivity and update the UI immediately
        cache.modify({
          fields: {
            // Force a refresh of any queries that depend on the answers
            discussionChannels(existingChannels = [], { readField }) {
              return existingChannels.map((channelRef: Reference) => {
                const channelId = readField('id', channelRef);
                if (channelId === updatedChannel.id) {
                  // Update this channel with the new answers
                  cache.writeFragment({
                    id: cache.identify(channelRef),
                    fragment: gql`
                      fragment UpdatedAnswers on DiscussionChannel {
                        id
                        answered
                        Answers {
                          id
                          text
                          CommentAuthor {
                            ... on User {
                              username
                            }
                            ... on ModerationProfile {
                              displayName
                            }
                          }
                        }
                      }
                    `,
                    data: updatedChannel,
                  });
                }
                return channelRef;
              });
            },
          },
        });
      }
    },
  }
);

const permissionData = computed(() => {
  if (getPermissionResult.value?.channels?.[0]) {
    return getPermissionResult.value.channels[0];
  }
  return null;
});

// Use the utility function to get all permissions at once
const userPermissions = computed(() => {
  return getAllPermissions({
    permissionData: permissionData.value,
    standardModRole: standardModRole.value,
    elevatedModRole: elevatedModRole.value,
    username: usernameVar.value,
    modProfileName: modProfileNameVar.value,
  });
});

const permalinkedCommentId = route.params.commentId;
const isHighlighted = computed(() => {
  return props.isPermalinked || permalinkedCommentId === props.commentData.id;
});

const replyCount = computed(() => {
  if (props.commentData.ChildCommentsAggregate) {
    return props.commentData.ChildCommentsAggregate.count;
  }
  return 0;
});

const textCopy = computed(() => props.commentData.text);

const canShowPermalink = computed(() => {
  const channelUniqueName =
    props.commentData.Channel?.uniqueName ||
    props.commentData?.DiscussionChannel?.channelUniqueName;
  const hasForumContext = !!(channelUniqueName || forumId.value);

  return !!(
    props.commentData.DiscussionChannel ||
    props.commentData.Event ||
    props.commentData.Issue ||
    props.commentData.Channel ||
    (issueNumber && forumId.value && props.commentData.id) || // For issue comments
    (discussionId && forumId.value) || // For discussion comments
    (eventId && forumId.value) || // For event comments
    (hasForumContext &&
      (props.commentData.GivesFeedbackOnDiscussion ||
        props.commentData.GivesFeedbackOnEvent ||
        props.commentData.GivesFeedbackOnComment))
  );
});

const isFeedbackComment = computed(() => {
  return (
    props.commentData.GivesFeedbackOnDiscussion ||
    props.commentData.GivesFeedbackOnEvent ||
    props.commentData.GivesFeedbackOnComment
  );
});

const permalinkObject = computed(() => {
  if (!canShowPermalink.value) {
    return {};
  }

  const channelUniqueName =
    props.commentData.Channel?.uniqueName ||
    props.commentData?.DiscussionChannel?.channelUniqueName;

  // If we don't have a valid forumId and we're not on a page with a forumId param,
  // we can't create a permalink
  if (!channelUniqueName && !forumId.value) {
    console.warn('Missing forumId for comment permalink', props.commentData.id);
    return {};
  }

  if (isFeedbackComment.value) {
    if (!channelUniqueName && !forumId.value) {
      return {};
    }
    return (
      getFeedbackPermalinkObject({
        routeName: route.name as string,
        forumId: channelUniqueName || (forumId.value as string),
        discussionId:
          props.commentData.GivesFeedbackOnDiscussion?.id ||
          (discussionId as string) ||
          props.commentData?.DiscussionChannel?.discussionId,
        eventId:
          props.commentData.GivesFeedbackOnEvent?.id || (eventId as string),
        commentId: props.commentData.id,
        GivesFeedbackOnComment:
          props.commentData.GivesFeedbackOnComment || undefined,
        GivesFeedbackOnDiscussion:
          props.commentData.GivesFeedbackOnDiscussion || undefined,
        GivesFeedbackOnEvent:
          props.commentData.GivesFeedbackOnEvent || undefined,
      }) || {}
    );
  }
  // This is the default comment permalink object
  let result = {};

  const discussionIdInLink =
    discussionId || props.commentData?.DiscussionChannel?.discussionId;
  if (discussionIdInLink && (channelUniqueName || forumId.value)) {
    // Permalink for comment on a discussion
    result = {
      name: 'forums-forumId-discussions-discussionId-comments-commentId',
      params: {
        discussionId: discussionIdInLink,
        commentId: props.commentData.id,
        forumId: channelUniqueName || forumId.value,
      },
    };
  }
  const eventIdInLink = eventId || props.commentData?.Event?.id;
  if (eventIdInLink && (channelUniqueName || forumId.value)) {
    result = {
      name: 'forums-forumId-events-eventId-comments-commentId',
      params: {
        eventId: props.commentData.Event?.id,
        forumId: channelUniqueName || forumId.value,
        commentId: props.commentData.id,
      },
    };
  }
  const issueNumberInLink =
    issueNumber || props.commentData?.Issue?.issueNumber;
  if (issueNumberInLink && channelUniqueName) {
    result = {
      name: 'forums-forumId-issues-issueNumber-comments-commentId',
      params: {
        issueNumber: issueNumberInLink,
        forumId: channelUniqueName,
        commentId: props.commentData.id,
      },
    };
  }

  return result;
});

let basePath = '';
if (import.meta.client) {
  basePath = window.location.origin;
} else {
  basePath = process.env.BASE_URL || '';
}

const permalink = computed(() => {
  if (!Object.keys(permalinkObject.value ?? {}).length) {
    return '';
  }
  return `${basePath}${router.resolve(permalinkObject.value ?? {}).href}`;
});

const copyLink = async () => {
  if (!permalink.value) {
    console.warn('No permalink available to copy');
    return;
  }

  try {
    await navigator.clipboard.writeText(permalink.value);
    emit('showCopiedLinkNotification', true);
  } catch (e: unknown) {
    throw e instanceof Error ? e : new Error(String(e));
  }
  setTimeout(() => {
    emit('showCopiedLinkNotification', false);
  }, 2000);
};

// Check if the current user is the discussion author
const isDiscussionAuthor = computed(() => {
  return props.originalPoster === usernameVar.value;
});

// Check if this comment is currently marked as an answer
const isMarkedAsAnswer = computed(() => {
  if (!props.answers || props.answers.length === 0) {
    return false;
  }

  // Check if this comment's ID is in the Answers array
  return props.answers.some(
    (answer: Comment) => answer.id === props.commentData.id
  );
});

// Functions for marking/unmarking as best answer
const handleMarkAsBestAnswer = async () => {
  // Get discussionId from route params or comment data
  const discussionIdFromRoute =
    typeof discussionId === 'string'
      ? discussionId
      : Array.isArray(discussionId)
        ? discussionId[0]
        : undefined;
  const discussionIdToUse =
    discussionIdFromRoute || props.commentData.DiscussionChannel?.discussionId;

  if (!discussionIdToUse) {
    console.warn('No discussion ID found for comment');
    return;
  }

  try {
    await markAsAnsweredByComment({
      commentId: props.commentData.id,
      channelId: forumId.value,
      discussionId: discussionIdToUse,
    });
    emit('showMarkedAsBestAnswerNotification', true);
    setTimeout(() => {
      emit('showMarkedAsBestAnswerNotification', false);
    }, 3000);
  } catch (error) {
    console.error('Error marking comment as best answer:', error);
  }
};

const handleUnmarkAsBestAnswer = async () => {
  // Get discussionId from route params or comment data
  const discussionIdFromRoute =
    typeof discussionId === 'string'
      ? discussionId
      : Array.isArray(discussionId)
        ? discussionId[0]
        : undefined;
  const discussionIdToUse =
    discussionIdFromRoute || props.commentData.DiscussionChannel?.discussionId;

  if (!discussionIdToUse) {
    console.warn('No discussion ID found for comment');
    return;
  }

  try {
    await unmarkCommentAsAnswer({
      commentId: props.commentData.id,
      channelId: forumId.value,
      discussionId: discussionIdToUse,
    });
    emit('showUnmarkedAsBestAnswerNotification', true);
    setTimeout(() => {
      emit('showUnmarkedAsBestAnswerNotification', false);
    }, 3000);
  } catch (error) {
    console.error('Error unmarking comment as best answer:', error);
  }
};

const commentMenuItems = computed(() => {
  let menuItems: MenuItemType[] = [];

  // Always add these base items for authenticated or unauthenticated users

  // Only show Copy Link when we have a valid permalink
  if (
    canShowPermalink.value &&
    Object.keys(permalinkObject.value ?? {}).length > 0
  ) {
    menuItems.push({
      label: 'Copy Link',
      value: '',
      event: 'copyLink',
      icon: ALLOWED_ICONS.COPY_LINK,
    });
  }

  // Always show feedback option if enabled
  if (props.enableFeedback) {
    menuItems.push({
      label: 'View Feedback',
      value: '',
      event: 'handleViewFeedback',
      icon: ALLOWED_ICONS.VIEW_FEEDBACK,
    });
  }

  // Return early if user is not logged in
  if (!usernameVar.value) {
    return menuItems;
  }

  const isOwnComment =
    props.commentData?.CommentAuthor?.__typename === 'User' &&
    props.commentData?.CommentAuthor?.username === usernameVar.value;

  // If user is the author of the comment
  if (isOwnComment) {
    menuItems.push({
      label: 'Edit',
      value: '',
      event: 'handleEdit',
      icon: ALLOWED_ICONS.EDIT,
    });
    menuItems.push({
      label: 'Delete',
      value: '',
      event: 'handleDelete',
      icon: ALLOWED_ICONS.DELETE,
    });
  }

  // If user is the discussion author and this is a root comment in a discussion
  if (
    isDiscussionAuthor.value &&
    discussionId &&
    props.depth === 1 &&
    !isOwnComment
  ) {
    if (!isMarkedAsAnswer.value) {
      menuItems.push({
        label: 'Mark as Best Answer',
        value: '',
        event: 'handleMarkAsBestAnswer',
        icon: ALLOWED_ICONS.MARK_BEST_ANSWER,
      });
    } else {
      menuItems.push({
        label: 'Undo Mark as Best Answer',
        value: '',
        event: 'handleUnmarkAsBestAnswer',
        icon: ALLOWED_ICONS.UNDO,
      });
    }
  }

  // Check if the user has any moderation permission (standard mod or above)
  // Standard mods are neither elevated nor suspended, but should still see Report and Give Feedback options
  const canPerformModActions =
    !userPermissions.value.isSuspendedMod &&
    (userPermissions.value.isChannelOwner ||
      userPermissions.value.isElevatedMod ||
      userPermissions.value.canReport ||
      userPermissions.value.canGiveFeedback ||
      userPermissions.value.canHideComment ||
      userPermissions.value.canSuspendUser);

  // Show mod actions if user has any mod permissions and isn't the comment author
  if (usernameVar.value && canPerformModActions && !isOwnComment) {
    // Create a list for mod actions
    const modActions: MenuItemType[] = [];

    // Add report action if user has permission
    if (userPermissions.value.canReport) {
      modActions.push({
        label: 'Report',
        value: '',
        event: 'clickReport',
        icon: ALLOWED_ICONS.REPORT,
      });
    }

    // Add feedback action if user has permission and feedback is enabled
    if (userPermissions.value.canGiveFeedback && props.enableFeedback) {
      modActions.push({
        label: 'Give Feedback',
        value: '',
        event: 'clickFeedback',
        icon: ALLOWED_ICONS.GIVE_FEEDBACK,
      });
    }

    // Add feedback management actions if comment has feedback
    if (
      props.enableFeedback &&
      props.commentData.FeedbackComments?.length > 0
    ) {
      modActions.push({
        label: 'Undo Feedback',
        value: '',
        event: 'clickUndoFeedback',
        icon: ALLOWED_ICONS.UNDO,
      });
      modActions.push({
        label: 'Edit Feedback',
        value: '',
        event: 'clickEditFeedback',
        icon: ALLOWED_ICONS.EDIT,
      });
    }

    // Add archive/unarchive actions based on current state and permissions
    if (!props.commentData.archived) {
      if (userPermissions.value.canHideComment) {
        modActions.push({
          label: 'Archive',
          event: 'handleClickArchive',
          icon: ALLOWED_ICONS.ARCHIVE,
          value: '',
        });
      }

      if (userPermissions.value.canSuspendUser) {
        modActions.push({
          label: 'Archive and Suspend',
          event: 'handleClickArchiveAndSuspend',
          icon: ALLOWED_ICONS.SUSPEND,
          value: '',
        });
      }
    } else {
      if (userPermissions.value.canHideComment) {
        modActions.push({
          label: 'Unarchive',
          event: 'handleClickUnarchive',
          icon: ALLOWED_ICONS.UNARCHIVE,
          value: '',
        });
      }
    }

    // Only add the mod actions section if there are actually actions to show
    if (modActions.length > 0) {
      menuItems.push({
        value: 'Moderation Actions',
        isDivider: true,
        label: '',
      });
      menuItems = menuItems.concat(modActions);
    }
  }

  return menuItems;
});

const showReplies = ref(true);
const highlight = ref(false);
const editorId = 'texteditor';

const maxCommentDepth = MAX_COMMENT_DEPTH;

function createComment(parentCommentId: string) {
  emit('createComment', parentCommentId);
}

function handleDelete(input: DeleteCommentInputData) {
  emit('delete-comment', input);
}

function handleEdit(commentData: Comment) {
  emit('click-edit-comment', commentData);
}

function updateExistingComment(text: string, depth: number) {
  emit('update-edit-comment-input', text, depth === 1);
}

function updateNewComment(input: CreateReplyInputData) {
  const { text, parentCommentId, depth } = input;
  if (parentCommentId) {
    emit('updateCreateReplyCommentInput', {
      text,
      parentCommentId,
      depth,
    });
  }
}

function handleReport() {
  emit('clickReport', props.commentData);
}

function handleFeedback(input: HandleFeedbackInput) {
  emit('clickFeedback', input);
}

function handleUndoFeedback(input: HandleFeedbackInput) {
  emit('clickUndoFeedback', input);
}

function handleEditFeedback(input: HandleEditFeedbackInput) {
  emit('clickEditFeedback', input);
}

const showEditCommentForm = computed(() => {
  return (
    !props.readonly && props.editFormOpenAtCommentID === props.commentData.id
  );
});

const saveDisabled = computed(() => {
  return (
    props.lengthOfCommentInProgress === 0 ||
    props.lengthOfCommentInProgress > MAX_CHARS_IN_COMMENT
  );
});
const label = computed(() => {
  let label = '';
  if (props.showLabel) {
    if (props.commentData.GivesFeedbackOnDiscussion) {
      label = 'Feedback on Discussion';
    } else if (props.commentData.GivesFeedbackOnEvent) {
      label = 'Feedback on Event';
    } else if (props.commentData.GivesFeedbackOnComment) {
      label = 'Feedback on Comment';
    } else if (props.commentData.Issue) {
      label = 'Comment on Issue';
    }
  }
  return label;
});
</script>

<template>
  <div>
    <div
      :class="[
        depth > 1
          ? 'ml-1 border-l border-gray-300 pl-4 pt-2 dark:border-gray-600'
          : '',
      ]"
      class="flex w-full"
    >
      <div :class="'text-sm'" class="w-full">
        <div
          :class="[
            isHighlighted
              ? 'rounded-md border border-orange-600 bg-orange-100 p-2 dark:bg-orange-950'
              : isMarkedAsAnswer
                ? 'dark:bg-green-950 rounded-md border border-green-600 bg-green-100 p-2'
                : 'dark:bg-gray-950',
          ]"
          class="flex w-full"
          data-testid="comment"
        >
          <div class="w-full flex-col rounded-lg">
            <CommentHeader
              :comment-data="props.commentData"
              :is-highlighted="isHighlighted"
              :parent-comment-id="props.parentCommentId"
              :show-context-link="props.showContextLink"
              :show-channel="props.showChannel"
              :original-poster="props.originalPoster"
              :label="label"
              :is-answer="isMarkedAsAnswer"
              :bot-usernames="props.botUsernames"
            />
            <div
              class="ml-4 flex-grow border-l border-gray-300 pl-4 dark:border-gray-600"
            >
              <div class="w-full dark:text-gray-200">
                <div class="w-full overflow-auto">
                  <ArchivedCommentText
                    v-if="props.commentData?.archived"
                    :channel-id="forumId"
                    :comment-id="props.commentData.id"
                  />
                  <div
                    v-else-if="
                      props.commentData.text &&
                      props.editFormOpenAtCommentID !== props.commentData.id
                    "
                    class="ml-3"
                    :class="[
                      props.goToPermalinkOnClick ? 'cursor-pointer' : '',
                    ]"
                  >
                    <ClientOnly>
                      <MarkdownPreview
                        v-if="
                          !goToPermalinkOnClick ||
                          !Object.keys(permalinkObject ?? {}).length
                        "
                        :key="textCopy || ''"
                        :text="textCopy || ''"
                        :word-limit="SHOW_MORE_THRESHOLD"
                        :disable-gallery="false"
                      />
                      <router-link
                        v-else-if="Object.keys(permalinkObject ?? {}).length"
                        :to="permalinkObject || {}"
                      >
                        <MarkdownPreview
                          :key="textCopy || ''"
                          :text="textCopy || ''"
                          :word-limit="SHOW_MORE_THRESHOLD"
                          :disable-gallery="true"
                        />
                      </router-link>
                      <template #fallback>
                        <MarkdownPreview
                          :key="textCopy || ''"
                          :text="textCopy || ''"
                          :word-limit="SHOW_MORE_THRESHOLD"
                          :disable-gallery="false"
                        />
                      </template>
                    </ClientOnly>
                  </div>
                  <TextEditor
                    v-if="showEditCommentForm"
                    id="editExistingComment"
                    class="mb-2 mt-3 p-1"
                    :initial-value="props.commentData.text || ''"
                    :editor-id="editorId"
                    :show-char-counter="true"
                    :max-chars="MAX_CHARS_IN_COMMENT"
                    @update="
                      (text) =>
                        emit(
                          'update-edit-comment-input',
                          text,
                          props.depth === 1
                        )
                    "
                  />
                  <ErrorBanner
                    v-if="
                      props.editCommentError &&
                      !props.readonly &&
                      props.editFormOpenAtCommentID === props.commentData.id
                    "
                    :text="
                      props.editCommentError && props.editCommentError.message
                    "
                  />
                </div>
                <div class="flex items-center">
                  <CommentButtons
                    v-if="forumId && props.showCommentButtons"
                    class="mb-1 ml-2"
                    :comment-data="props.commentData"
                    :enable-feedback="props.enableFeedback"
                    :depth="props.depth"
                    :locked="props.locked"
                    :parent-comment-id="props.parentCommentId"
                    :show-edit-comment-field="
                      props.editFormOpenAtCommentID === props.commentData.id
                    "
                    :show-replies="showReplies"
                    :reply-form-open-at-comment-i-d="
                      props.replyFormOpenAtCommentID
                    "
                    :comment-in-process="
                      props.commentInProcess && !props.editCommentError
                    "
                    :save-disabled="saveDisabled"
                    :length-of-comment-in-progress="lengthOfCommentInProgress"
                    :reply-has-bot-mention="props.replyHasBotMention"
                    :bot-suggestions="props.botSuggestions"
                    :is-permalinked="isHighlighted"
                    :is-marked-as-answer="isMarkedAsAnswer"
                    @start-comment-save="emit('startCommentSave', $event)"
                    @click-edit-comment="handleEdit"
                    @create-comment="createComment"
                    @open-reply-editor="
                      (commentId) => emit('openReplyEditor', commentId)
                    "
                    @hide-reply-editor="emit('hideReplyEditor')"
                    @open-edit-comment-editor="
                      emit('openEditCommentEditor', props.commentData.id)
                    "
                    @hide-edit-comment-editor="emit('hideEditCommentEditor')"
                    @hide-replies="showReplies = false"
                    @open-mod-profile="emit('openModProfile')"
                    @save-edit="emit('saveEdit')"
                    @show-replies="showReplies = true"
                    @update-new-comment="updateNewComment"
                    @click-feedback="
                      () =>
                        handleFeedback({
                          commentData: props.commentData,
                          parentCommentId: props.parentCommentId,
                        })
                    "
                    @handle-view-feedback="
                      emit('handleViewFeedback', props.commentData.id)
                    "
                    @click-undo-feedback="
                      () =>
                        handleUndoFeedback({
                          commentData: props.commentData,
                          parentCommentId: props.parentCommentId,
                        })
                    "
                    @click-edit-feedback="
                      () =>
                        handleEditFeedback({
                          commentData: props.commentData,
                        })
                    "
                  >
                    <MenuButton
                      v-if="commentMenuItems.length > 0"
                      :data-testid="'commentMenu'"
                      :items="commentMenuItems"
                      :is-marked-as-answer="isMarkedAsAnswer"
                      :aria-label="'Comment actions'"
                      @copy-link="copyLink"
                      @handle-edit="() => handleEdit(props.commentData)"
                      @click-report="handleReport"
                      @click-feedback="
                        () => {
                          handleFeedback({
                            commentData: props.commentData,
                            parentCommentId: props.parentCommentId,
                          });
                        }
                      "
                      @click-undo-feedback="
                        () =>
                          handleUndoFeedback({
                            commentData: props.commentData,
                            parentCommentId: props.parentCommentId,
                          })
                      "
                      @handle-view-feedback="
                        emit('handleViewFeedback', props.commentData.id)
                      "
                      @handle-delete="
                        () => {
                          const deleteCommentInput = {
                            commentId: props.commentData.id,
                            parentCommentId: props.parentCommentId,
                            replyCount: replyCount,
                          };
                          handleDelete(deleteCommentInput);
                        }
                      "
                      @click-edit-feedback="
                        () =>
                          handleEditFeedback({ commentData: props.commentData })
                      "
                      @handle-click-archive="
                        () => {
                          emit('handleClickArchive', props.commentData.id);
                        }
                      "
                      @handle-click-archive-and-suspend="
                        () => {
                          emit(
                            'handleClickArchiveAndSuspend',
                            props.commentData.id
                          );
                        }
                      "
                      @handle-click-unarchive="
                        () => {
                          emit('handleClickUnarchive', props.commentData.id);
                        }
                      "
                      @handle-mark-as-best-answer="handleMarkAsBestAnswer"
                      @handle-unmark-as-best-answer="handleUnmarkAsBestAnswer"
                    >
                      <EllipsisHorizontal
                        class="h-5 w-5 cursor-pointer hover:text-black dark:text-gray-300 dark:hover:text-white"
                      />
                    </MenuButton>
                  </CommentButtons>
                </div>
              </div>
            </div>
          </div>
        </div>
        <nuxt-link
          v-if="
            canShowPermalink &&
            replyCount > 0 &&
            props.depth + 1 > maxCommentDepth
          "
          class="flex w-full cursor-pointer items-center gap-1 border-gray-300 pl-4 text-gray-400 underline dark:border-gray-500 dark:text-gray-300"
          :to="permalinkObject"
          @click.prevent="emit('scrollToTop')"
        >
          Continue thread
          <RightArrowIcon class="h-4 w-4" />
        </nuxt-link>
        <div
          v-else-if="replyCount > 0 && showReplies"
          id="childComments"
          class="ml-3 w-full border-gray-300 dark:border-gray-600"
        >
          <ChildComments
            v-slot="slotProps"
            :parent-comment-id="props.commentData.id"
            :mod-name="props.modProfileName"
            @mouseenter="highlight = true"
            @mouseleave="highlight = false"
          >
            <div
              v-for="childComment in slotProps.comments"
              :key="childComment.id"
            >
              <Comment
                v-if="childComment.id !== permalinkedCommentId"
                :compact="true"
                :comment-data="childComment"
                :depth="props.depth + 1"
                :locked="props.locked"
                :parent-comment-id="props.commentData.id"
                :comment-in-process="props.commentInProcess"
                :edit-form-open-at-comment-i-d="editFormOpenAtCommentID"
                :reply-form-open-at-comment-i-d="props.replyFormOpenAtCommentID"
                :mod-profile-name="props.modProfileName"
                :original-poster="props.originalPoster"
                :length-of-comment-in-progress="props.lengthOfCommentInProgress"
                :answers="props.answers"
                :bot-usernames="props.botUsernames"
                @start-comment-save="emit('startCommentSave')"
                @click-edit-comment="handleEdit"
                @click-report="emit('clickReport', $event)"
                @delete-comment="(input) => emit('delete-comment', input)"
                @create-comment="emit('createComment')"
                @save-edit="emit('saveEdit')"
                @update-create-reply-comment-input="updateNewComment"
                @update-edit-comment-input="updateExistingComment"
                @show-copied-link-notification="
                  emit('showCopiedLinkNotification', $event)
                "
                @open-mod-profile="emit('openModProfile')"
                @scroll-to-top="emit('scrollToTop')"
                @open-reply-editor="
                  ($event: string) => emit('openReplyEditor', $event)
                "
                @hide-reply-editor="emit('hideReplyEditor')"
                @open-edit-comment-editor="
                  emit('openEditCommentEditor', childComment.id)
                "
                @hide-edit-comment-editor="emit('hideEditCommentEditor')"
                @click-feedback="handleFeedback"
                @click-undo-feedback="handleUndoFeedback"
                @handle-view-feedback="
                  (commentId: string) => emit('handleViewFeedback', commentId)
                "
                @handle-click-archive="
                  (commentId: string) => {
                    emit('handleClickArchive', commentId);
                  }
                "
                @handle-click-archive-and-suspend="
                  (commentId: string) => {
                    emit('handleClickArchiveAndSuspend', commentId);
                  }
                "
                @handle-click-unarchive="
                  (commentId: string) => emit('handleClickUnarchive', commentId)
                "
              />
            </div>
          </ChildComments>
        </div>
      </div>
    </div>
  </div>
</template>

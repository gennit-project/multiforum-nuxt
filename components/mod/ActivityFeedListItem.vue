<script lang="ts" setup>
import MarkdownPreview from '../MarkdownPreview.vue';
import TextEditor from '@/components/TextEditor.vue';
import GenericButton from '@/components/GenericButton.vue';
import SaveButton from '@/components/SaveButton.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import { ref, computed, watch, type PropType } from 'vue';
import { timeAgo } from '@/utils';
import type { Discussion, ModerationAction } from '@/__generated__/graphql';
import { useRoute } from 'nuxt/app';
import ArchiveBox from '../icons/ArchiveBox.vue';
import ArchiveBoxXMark from '../icons/ArchiveBoxXMark.vue';
import ChatBubbleBottomCenter from '../icons/ChatBubbleBottomCenter.vue';
import XmarkIcon from '../icons/XmarkIcon.vue';
import UserPlus from '../icons/UserPlus.vue';
import UserMinus from '../icons/UserMinus.vue';
import ArrowPath from '../icons/ArrowPath.vue';
import FlagIcon from '../icons/FlagIcon.vue';
import XCircleIcon from '../icons/XCircleIcon.vue';
import PencilIcon from '../icons/PencilIcon.vue';
import TrashIcon from '../icons/TrashIcon.vue';
import { ActionType } from '@/types/Comment';
import { useMutation } from '@vue/apollo-composable';
import { UPDATE_COMMENT } from '@/graphQLData/comment/mutations';
import { modProfileNameVar, usernameVar } from '@/cache';
import RevisionDiffInline from '@/components/mod/RevisionDiffInline.vue';

const actionTypeToIcon = {
  [ActionType.Close]: XCircleIcon,
  [ActionType.Comment]: ChatBubbleBottomCenter,
  [ActionType.Remove]: XmarkIcon,
  [ActionType.Reopen]: ArrowPath,
  [ActionType.Report]: FlagIcon,
  [ActionType.Suspension]: UserMinus,
  [ActionType.Unsuspend]: UserPlus,
  [ActionType.Archive]: ArchiveBox,
  [ActionType.Unarchive]: ArchiveBoxXMark,
  [ActionType.Edit]: PencilIcon,
  [ActionType.Delete]: TrashIcon,
};

const props = defineProps({
  activityItem: {
    type: Object as PropType<ModerationAction>,
    required: true,
  },
  isOriginalPoster: {
    type: Boolean,
    default: false,
  },
  relatedDiscussion: {
    type: Object as PropType<Discussion | null>,
    default: null,
  },
  nextRevisionBody: {
    type: String as PropType<string | null>,
    default: null,
  },
  commentEditIndex: {
    type: Number as PropType<number | null>,
    default: null,
  },
});
const commentIdInParams = useRoute().params.commentId as string;
const isPermalinked =
  commentIdInParams && commentIdInParams === props.activityItem.Comment?.id;

const isCommentAuthor = computed(() => {
  const author = props.activityItem.Comment?.CommentAuthor;
  if (!author) return false;

  if ('username' in author) {
    return !!usernameVar.value && author.username === usernameVar.value;
  }

  if ('displayName' in author) {
    return (
      !!modProfileNameVar.value &&
      author.displayName === modProfileNameVar.value
    );
  }

  return false;
});

const isEditing = ref(false);
const editedComment = ref(props.activityItem.Comment?.text || '');

watch(
  () => props.activityItem.Comment?.text,
  (newText) => {
    if (!isEditing.value) {
      editedComment.value = newText || '';
    }
  },
  { immediate: true }
);

const hasChanges = computed(() => {
  return (
    (editedComment.value || '') !== (props.activityItem.Comment?.text || '')
  );
});

const hasRevision = computed(() => {
  return !!props.activityItem.Revision && !!props.relatedDiscussion;
});

const getContentNoun = (description: string) => {
  if (description.includes('comment')) return 'comment';
  if (description.includes('discussion')) return 'discussion';
  if (description.includes('download')) return 'download';
  if (description.includes('event')) return 'event';
  if (description.includes('issue')) return 'issue';
  return 'content';
};

const actionPhrase = computed(() => {
  const actionType = props.activityItem.actionType as ActionType | undefined;
  const actionDescription = (
    props.activityItem.actionDescription || ''
  ).toLowerCase();
  const contentNoun = getContentNoun(actionDescription);

  switch (actionType) {
    case ActionType.Reopen:
      return 'the issue was reopened by';
    case ActionType.Close:
      return 'the issue was closed by';
    case ActionType.Edit:
      return `the ${contentNoun} was edited by`;
    case ActionType.Delete:
      return `the ${contentNoun} was deleted by`;
    case ActionType.Remove:
      return `the ${contentNoun} was removed by`;
    case ActionType.Archive:
      return `the ${contentNoun} was archived by`;
    case ActionType.Unarchive:
      return `the ${contentNoun} was unarchived by`;
    case ActionType.Report:
      return `the ${contentNoun} was reported by`;
    case ActionType.Comment:
      return 'a comment was added by';
    case ActionType.Suspension:
      return 'the user was suspended by';
    case ActionType.Unsuspend:
      return 'the user was unsuspended by';
    default:
      return null;
  }
});

const usePassiveDescription = computed(() => {
  return !!actionPhrase.value;
});

const revisionContent = computed(() => {
  if (!props.activityItem.Revision || !props.relatedDiscussion) {
    return null;
  }

  const actionDescription = (
    props.activityItem.actionDescription || ''
  ).toLowerCase();
  const isTitleEdit = actionDescription.includes('title');
  const useTitle = isTitleEdit;

  // Use nextRevisionBody if available (for older edits), otherwise use current discussion body
  const newBodyContent =
    props.nextRevisionBody !== null
      ? props.nextRevisionBody
      : props.relatedDiscussion.body || '';

  const newVersion = {
    id: 'current',
    title: useTitle ? props.relatedDiscussion.title || '' : undefined,
    body: useTitle ? undefined : newBodyContent,
    createdAt:
      props.relatedDiscussion.updatedAt ||
      props.relatedDiscussion.createdAt ||
      props.activityItem.Revision.createdAt ||
      '',
    Author: props.relatedDiscussion.Author || null,
    editReason: props.relatedDiscussion.editReason || '',
  };

  if (useTitle) {
    return {
      oldVersion: {
        id: props.activityItem.Revision.id,
        title: props.activityItem.Revision.body || '',
        createdAt: props.activityItem.Revision.createdAt,
        Author: props.activityItem.Revision.Author || null,
      },
      newVersion,
    };
  }

  return {
    oldVersion: props.activityItem.Revision,
    newVersion,
  };
});

// Check if this is a comment edit with revision history
const hasCommentRevision = computed(() => {
  const comment = props.activityItem.Comment as
    | (typeof props.activityItem.Comment & {
        PastVersions?: Array<{ id: string; body: string; createdAt: string }>;
      })
    | undefined;
  return (
    props.commentEditIndex !== null &&
    comment?.PastVersions &&
    comment.PastVersions.length > props.commentEditIndex
  );
});

// Build the comment revision content for the diff
const commentRevisionContent = computed(() => {
  if (props.commentEditIndex === null) return null;

  const comment = props.activityItem.Comment as
    | (typeof props.activityItem.Comment & {
        PastVersions?: Array<{
          id: string;
          body: string;
          createdAt: string;
          Author?: { username: string } | null;
        }>;
      })
    | undefined;

  const pastVersions = comment?.PastVersions;
  if (!pastVersions || pastVersions.length <= props.commentEditIndex) {
    return null;
  }

  const editIndex = props.commentEditIndex;

  // Old version is at the edit index in PastVersions
  const oldVersion = pastVersions[editIndex];
  if (!oldVersion) return null;

  // New version is either the previous PastVersion (if exists) or the current comment text
  let newBody: string;
  let newCreatedAt: string;
  const newerVersion = editIndex > 0 ? pastVersions[editIndex - 1] : null;
  if (newerVersion) {
    // There's a more recent past version - that's what this edit changed TO
    newBody = newerVersion.body;
    newCreatedAt = newerVersion.createdAt;
  } else {
    // This is the most recent edit - new version is the current comment text
    newBody = comment?.text || '';
    newCreatedAt = comment?.updatedAt || comment?.createdAt || '';
  }

  return {
    oldVersion: {
      id: oldVersion.id,
      body: oldVersion.body,
      createdAt: oldVersion.createdAt,
      Author: oldVersion.Author || null,
    },
    newVersion: {
      id: 'current',
      body: newBody,
      createdAt: newCreatedAt,
      Author: null,
    },
  };
});

const {
  mutate: updateComment,
  loading: updateCommentLoading,
  error: updateCommentError,
  onDone: onUpdateDone,
} = useMutation(UPDATE_COMMENT, () => ({
  variables: {
    commentWhere: { id: props.activityItem.Comment?.id },
    updateCommentInput: { text: editedComment.value },
  },
}));

onUpdateDone(() => {
  isEditing.value = false;
});

const startEdit = () => {
  if (!isCommentAuthor.value) return;
  editedComment.value = props.activityItem.Comment?.text || '';
  isEditing.value = true;
};

const cancelEdit = () => {
  editedComment.value = props.activityItem.Comment?.text || '';
  isEditing.value = false;
};

const saveEdit = async () => {
  if (!props.activityItem.Comment?.id) return;
  if (!editedComment.value.trim()) return;
  if (!hasChanges.value) {
    isEditing.value = false;
    return;
  }
  try {
    await updateComment();
  } catch (error) {
    console.error('Error updating comment', error);
  }
};
</script>

<template>
  <li
    class="mt-4 list-none"
    :class="[
      isPermalinked
        ? 'dark:bg-orange-950 rounded-lg border border-orange-500 bg-orange-100'
        : '',
    ]"
  >
    <div class="relative">
      <span
        class="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600"
        aria-hidden="true"
      />
      <div class="relative flex items-start space-x-3">
        <div>
          <div class="relative px-1">
            <div
              v-if="activityItem.actionType"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 ring-8 ring-white dark:text-white dark:ring-gray-800"
            >
              <component
                :is="actionTypeToIcon[activityItem.actionType as ActionType]"
                class="h-5 w-5 text-white"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
        <div class="min-w-0 flex-1 py-0">
          <div class="text-sm leading-6 text-gray-500 dark:text-gray-300">
            <span class="mr-0.5 flex flex-row items-center gap-1">
              <template v-if="usePassiveDescription">
                <span class="text-gray-700 dark:text-gray-200">
                  {{ actionPhrase }}
                </span>
              </template>

              <!-- Link for ModerationProfile -->
              <AvatarComponent
                v-if="activityItem.ModerationProfile?.displayName"
                :text="activityItem.ModerationProfile?.displayName"
                :is-small="true"
              />
              <nuxt-link
                v-if="activityItem.ModerationProfile?.displayName"
                :to="{
                  name: isOriginalPoster ? 'u-username' : 'mod-modId',
                  params: {
                    [isOriginalPoster ? 'username' : 'modId']:
                      activityItem.ModerationProfile.displayName,
                  },
                }"
                class="flex items-center gap-1 font-medium text-gray-900 hover:underline dark:text-gray-200"
              >
                <span class="flex flex-row items-center gap-1">
                  {{ activityItem.ModerationProfile?.displayName }}
                  <span
                    v-if="isOriginalPoster"
                    class="rounded-md border border-gray-500 px-1 py-0 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300"
                    >OP</span
                  >
                </span>
              </nuxt-link>

              <!-- Link for User -->
              <AvatarComponent
                v-if="activityItem.User?.username"
                :text="activityItem.User.username"
                :is-small="true"
              />
              <nuxt-link
                v-if="activityItem.User?.username"
                :to="{
                  name: 'u-username',
                  params: {
                    username: activityItem.User.username,
                  },
                }"
                class="flex items-center gap-1 font-medium text-gray-900 hover:underline dark:text-gray-200"
              >
                <span class="flex items-center gap-1">
                  {{ activityItem.User.username }}
                  <span
                    v-if="isOriginalPoster"
                    class="rounded-md border border-gray-500 px-1 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300"
                    >OP</span
                  >
                </span>
              </nuxt-link>
              <template v-if="!usePassiveDescription">
                {{ activityItem.actionDescription }}
              </template>
            </span>
            {{ ' ' }}

            <span class="whitespace-nowrap">{{
              `${timeAgo(new Date(activityItem.createdAt))}`
            }}</span>
          </div>

          <div class="border-l-2 border-gray-200 pl-2 dark:border-gray-500">
            <div
              v-if="activityItem.Comment"
              class="mb-2 flex items-center justify-between gap-2"
            >
              <MarkdownPreview
                v-if="!isEditing"
                :text="activityItem.Comment.text || ''"
                :word-limit="1000"
                :disable-gallery="true"
              />
              <div v-else class="w-full space-y-2">
                <TextEditor
                  :key="`activity-comment-${activityItem.Comment?.id}`"
                  :rows="4"
                  :allow-image-upload="false"
                  :initial-value="editedComment"
                  :placeholder="'Edit your comment...'"
                  @update="editedComment = $event"
                />
              </div>
            </div>
            <div
              v-if="activityItem.Comment && isCommentAuthor"
              class="flex flex-wrap items-center gap-2"
            >
              <GenericButton
                v-if="!isEditing"
                :text="'Edit'"
                @click="startEdit"
              />
              <template v-else>
                <GenericButton :text="'Cancel'" @click="cancelEdit" />
                <SaveButton
                  :label="'Save'"
                  :disabled="
                    updateCommentLoading || !editedComment.trim() || !hasChanges
                  "
                  :loading="updateCommentLoading"
                  @click="saveEdit"
                />
              </template>
            </div>
            <ErrorBanner
              v-if="updateCommentError"
              class="mt-2"
              :text="updateCommentError.message"
            />
            <!-- Discussion revision diff -->
            <RevisionDiffInline
              v-if="hasRevision && revisionContent"
              :old-version="revisionContent.oldVersion"
              :new-version="revisionContent.newVersion"
            />
            <!-- Comment revision diff -->
            <RevisionDiffInline
              v-if="hasCommentRevision && commentRevisionContent"
              :old-version="commentRevisionContent.oldVersion"
              :new-version="commentRevisionContent.newVersion"
            />
          </div>
        </div>
      </div>
    </div>
  </li>
</template>

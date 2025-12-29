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
    return !!modProfileNameVar.value && author.displayName === modProfileNameVar.value;
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
  return (editedComment.value || '') !== (props.activityItem.Comment?.text || '');
});

const hasRevision = computed(() => {
  return !!props.activityItem.Revision && !!props.relatedDiscussion;
});

const revisionContent = computed(() => {
  if (!props.activityItem.Revision || !props.relatedDiscussion) {
    return null;
  }

  const actionDescription = (props.activityItem.actionDescription || '').toLowerCase();
  const isTitleEdit = actionDescription.includes('title');
  const useTitle = isTitleEdit;

  // Use nextRevisionBody if available (for older edits), otherwise use current discussion body
  const newBodyContent = props.nextRevisionBody !== null
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
        ? 'rounded-lg border border-orange-500 bg-orange-100 dark:bg-orange-900'
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
          <div class="text-xs leading-8 text-gray-500 dark:text-gray-300">
            <span class="mr-0.5 flex flex-row items-center gap-1">
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
              {{ activityItem.actionDescription }}
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
            <RevisionDiffInline
              v-if="hasRevision && revisionContent"
              :old-version="revisionContent.oldVersion"
              :new-version="revisionContent.newVersion"
            />
          </div>
        </div>
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'nuxt/app';
import { useQuery, useMutation } from '@vue/apollo-composable';
import GenericModal from '@/components/GenericModal.vue';
import TextEditor from '@/components/TextEditor.vue';
import SelectBrokenRules from '@/components/admin/SelectBrokenRules.vue';
import PencilIcon from '@/components/icons/PencilIcon.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import type { PropType } from 'vue';
import { GET_DISCUSSION } from '@/graphQLData/discussion/queries';
import { GET_EVENT } from '@/graphQLData/event/queries';
import { GET_COMMENT } from '@/graphQLData/comment/queries';
import { UPDATE_COMMENT } from '@/graphQLData/comment/mutations';
import { UPDATE_DISCUSSION } from '@/graphQLData/discussion/mutations';
import { UPDATE_EVENT_WITH_CHANNEL_CONNECTIONS } from '@/graphQLData/event/mutations';
import { ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD } from '@/graphQLData/issue/mutations';
import { modProfileNameVar } from '@/cache';

type TargetType = 'comment' | 'discussion' | 'download' | 'event';

const props = defineProps({
  open: { type: Boolean, default: false },
  targetType: {
    type: String as PropType<TargetType>,
    required: true,
  },
  issueId: { type: String, required: true },
  commentId: { type: String, default: '' },
  discussionId: { type: String, default: '' },
  eventId: { type: String, default: '' },
  channelUniqueName: { type: String, required: true },
});

const emit = defineEmits(['close', 'saved']);

const route = useRoute();
const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const selectedForumRules = ref<string[]>([]);
const selectedServerRules = ref<string[]>([]);
const editReason = ref('');
const titleValue = ref('');
const bodyValue = ref('');
const loadingSave = ref(false);
const validationError = ref('');
const mutationError = ref('');

// Fetch content per target
const { result: commentResult } = useQuery(
  GET_COMMENT,
  () => ({ id: props.commentId }),
  () => ({
    enabled: props.targetType === 'comment' && !!props.commentId,
    fetchPolicy: 'cache-first',
  })
);

const { result: discussionResult } = useQuery(
  GET_DISCUSSION,
  () => ({
    id: props.discussionId,
    loggedInModName: modProfileNameVar.value,
    channelUniqueName: channelId.value,
  }),
  () => ({
    enabled:
      (props.targetType === 'discussion' || props.targetType === 'download') &&
      !!props.discussionId,
    fetchPolicy: 'cache-first',
  })
);

const { result: eventResult } = useQuery(
  GET_EVENT,
  () => ({
    id: props.eventId,
    channelUniqueName: channelId.value,
    loggedInModName: modProfileNameVar.value,
  }),
  () => ({
    enabled: props.targetType === 'event' && !!props.eventId,
    fetchPolicy: 'cache-first',
  })
);

const initialTitle = computed(() => {
  if (props.targetType === 'comment') return '';
  if (props.targetType === 'event') return eventResult.value?.events?.[0]?.title || '';
  return discussionResult.value?.discussions?.[0]?.title || '';
});

const initialBody = computed(() => {
  if (props.targetType === 'comment') {
    return commentResult.value?.comments?.[0]?.text || '';
  }
  if (props.targetType === 'event') {
    return eventResult.value?.events?.[0]?.description || '';
  }
  return discussionResult.value?.discussions?.[0]?.body || '';
});

watch(
  () => props.open,
  (open) => {
    if (open) {
      titleValue.value = initialTitle.value;
      bodyValue.value = initialBody.value;
      selectedForumRules.value = [];
      selectedServerRules.value = [];
      editReason.value = '';
      validationError.value = '';
      mutationError.value = '';
    }
  }
);

const toggleSelection = (
  target: 'forum' | 'server',
  rule: string
) => {
  const list =
    target === 'forum' ? selectedForumRules.value : selectedServerRules.value;
  const setter =
    target === 'forum'
      ? (val: string[]) => (selectedForumRules.value = val)
      : (val: string[]) => (selectedServerRules.value = val);
  if (list.includes(rule)) {
    setter(list.filter((r) => r !== rule));
  } else {
    setter([...list, rule]);
  }
};

const {
  mutate: updateComment,
  loading: updateCommentLoading,
  onError: onUpdateCommentError,
} = useMutation(UPDATE_COMMENT);

onUpdateCommentError((error) => {
  mutationError.value = error.message || 'Failed to save edits.';
});

const {
  mutate: updateDiscussion,
  loading: updateDiscussionLoading,
} = useMutation(UPDATE_DISCUSSION);

const {
  mutate: updateEvent,
  loading: updateEventLoading,
} = useMutation(UPDATE_EVENT_WITH_CHANNEL_CONNECTIONS);

const {
  mutate: addFeedItem,
  loading: addFeedItemLoading,
} = useMutation(ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD);

const isLoading = computed(() => {
  return (
    loadingSave.value ||
    updateCommentLoading.value ||
    updateDiscussionLoading.value ||
    updateEventLoading.value ||
    addFeedItemLoading.value
  );
});

const hasRequiredRules = computed(() => {
  return (
    selectedForumRules.value.length > 0 || selectedServerRules.value.length > 0
  );
});

const buildActivityComment = () => {
  const rulesText = [
    selectedForumRules.value.length
      ? `Forum rules: ${selectedForumRules.value.join(', ')}`
      : null,
    selectedServerRules.value.length
      ? `Server rules: ${selectedServerRules.value.join(', ')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  const reasonText = editReason.value
    ? `Reason: ${editReason.value}`
    : 'Reason: (not provided)';

  return [rulesText, reasonText].filter(Boolean).join('\n');
};

const saveEdits = async () => {
  validationError.value = '';
  if (!hasRequiredRules.value) {
    validationError.value = 'Select at least one broken rule.';
    return;
  }

  try {
    loadingSave.value = true;
    mutationError.value = '';
    if (props.targetType === 'comment') {
      await updateComment({
        updateCommentInput: { text: bodyValue.value, editReason: editReason.value },
        commentWhere: { id: props.commentId },
      });
    } else if (
      props.targetType === 'discussion' ||
      props.targetType === 'download'
    ) {
      await updateDiscussion({
        where: { id: props.discussionId },
        updateDiscussionInput: {
          title: titleValue.value,
          body: bodyValue.value,
          editReason: editReason.value,
        },
      });
    } else if (props.targetType === 'event') {
      await updateEvent({
        updateEventInput: {
          title: titleValue.value,
          description: bodyValue.value,
          editReason: editReason.value,
        },
        where: { id: props.eventId },
        channelConnections: [],
        channelDisconnections: [],
      });
    }

    const actionSummary = (() => {
      switch (props.targetType) {
        case 'comment':
          return 'edited the comment.';
        case 'discussion':
          return 'edited the discussion.';
        case 'download':
          return 'edited the download.';
        case 'event':
          return 'edited the event.';
        default:
          return 'edited the content.';
      }
    })();

    await addFeedItem({
      issueId: props.issueId,
      actionDescription: `${modProfileNameVar.value} ${actionSummary}`,
      actionType: 'EDIT_CONTENT',
      displayName: modProfileNameVar.value || '',
      commentText: buildActivityComment(),
      channelUniqueName: props.channelUniqueName,
      flaggedServerRuleViolation: true,
    });

    emit('saved');
    emit('close');
  } catch (err) {
    console.error('Error saving edits', err);
  } finally {
    loadingSave.value = false;
  }
};

defineExpose({
  selectedForumRules,
  selectedServerRules,
  editReason,
  titleValue,
  bodyValue,
  saveEdits,
});
</script>

<template>
  <GenericModal
    :open="open"
    :title="'Edit Content'"
    :show-footer="false"
    @close="emit('close')"
  >
    <template #icon>
      <PencilIcon class="h-6 w-6 text-blue-600" />
    </template>
    <template #content>
      <div class="space-y-4">
        <div class="space-y-1">
          <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Select broken rules
          </p>
          <SelectBrokenRules
            :selected-forum-rules="selectedForumRules"
            :selected-server-rules="selectedServerRules"
            @toggle-forum-rule-selection="(rule) => toggleSelection('forum', rule)"
            @toggle-server-rule-selection="(rule) => toggleSelection('server', rule)"
          />
        </div>

        <div class="space-y-2">
          <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Edit reason
          </p>
          <TextEditor
            :rows="3"
            :placeholder="'Briefly explain the edit for audit/history'"
            :initial-value="editReason"
            :disable-toolbar="true"
            @update="(val) => (editReason.value = val)"
          />
        </div>

        <div v-if="targetType !== 'comment'" class="space-y-2">
          <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Title
          </p>
          <TextEditor
            :rows="2"
            :placeholder="'Update the title...'"
            :initial-value="titleValue"
            :disable-toolbar="true"
            @update="(val) => (titleValue.value = val)"
          />
        </div>

        <div class="space-y-2">
          <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {{ targetType === 'event' ? 'Description' : 'Body' }}
          </p>
          <TextEditor
            :rows="8"
            :placeholder="'Update the content...'"
            :initial-value="bodyValue"
            @update="(val) => (bodyValue.value = val)"
          />
        </div>

        <p v-if="validationError" class="text-sm text-red-600">
          {{ validationError }}
        </p>
        <ErrorBanner v-if="mutationError" :text="mutationError" />

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-500"
            :disabled="isLoading"
            @click="saveEdits"
          >
            <PencilIcon class="h-4 w-4" />
            Save edits
          </button>
        </div>
      </div>
    </template>
  </GenericModal>
</template>

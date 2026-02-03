<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'nuxt/app';
import { useQuery, useMutation } from '@vue/apollo-composable';
import GenericModal from '@/components/GenericModal.vue';
import TextEditor from '@/components/TextEditor.vue';
import SelectBrokenRules from '@/components/admin/SelectBrokenRules.vue';
import PencilIcon from '@/components/icons/PencilIcon.vue';
import ButtonContent from '@/components/ButtonContent.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import type { PropType } from 'vue';
import { GET_DISCUSSION } from '@/graphQLData/discussion/queries';
import { GET_EVENT } from '@/graphQLData/event/queries';
import { GET_COMMENT } from '@/graphQLData/comment/queries';
import { UPDATE_COMMENT } from '@/graphQLData/comment/mutations';
import { UPDATE_DISCUSSION } from '@/graphQLData/discussion/mutations';
import { UPDATE_EVENT_WITH_CHANNEL_CONNECTIONS } from '@/graphQLData/event/mutations';
import {
  ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD,
  UPDATE_ISSUE,
} from '@/graphQLData/issue/mutations';
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
const validationError = ref('');

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
  if (props.targetType === 'event')
    return eventResult.value?.events?.[0]?.title || '';
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
    }
  }
);

const toggleSelection = (target: 'forum' | 'server', rule: string) => {
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

const updateEditReason = (val: string) => {
  editReason.value = val;
};

const updateTitleValue = (val: string) => {
  titleValue.value = val;
};

const updateBodyValue = (val: string) => {
  bodyValue.value = val;
};

const {
  mutate: updateComment,
  loading: updateCommentLoading,
  error: updateCommentError,
} = useMutation(UPDATE_COMMENT);

const {
  mutate: updateDiscussion,
  loading: updateDiscussionLoading,
  error: updateDiscussionError,
} = useMutation(UPDATE_DISCUSSION);

const {
  mutate: updateEvent,
  loading: updateEventLoading,
  error: updateEventError,
} = useMutation(UPDATE_EVENT_WITH_CHANNEL_CONNECTIONS);

const {
  mutate: addFeedItem,
  loading: addFeedItemLoading,
  error: addFeedItemError,
} = useMutation(ADD_ISSUE_ACTIVITY_FEED_ITEM_WITH_COMMENT_AS_MOD);

const {
  mutate: updateIssue,
  loading: updateIssueLoading,
  error: updateIssueError,
} = useMutation(UPDATE_ISSUE);

const mutationError = computed(() => {
  return (
    updateCommentError.value?.message ||
    updateDiscussionError.value?.message ||
    updateEventError.value?.message ||
    updateIssueError.value?.message ||
    addFeedItemError.value?.message ||
    ''
  );
});

const isLoading = computed(() => {
  return (
    updateCommentLoading.value ||
    updateDiscussionLoading.value ||
    updateEventLoading.value ||
    updateIssueLoading.value ||
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
    selectedServerRules.value.length
      ? `Server rules: ${selectedServerRules.value.join(', ')}`
      : null,
    selectedForumRules.value.length
      ? `Forum rules: ${selectedForumRules.value.join(', ')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  const reasonText = editReason.value ? `Reason: ${editReason.value}` : null;

  return [rulesText, reasonText].filter(Boolean).join('\n');
};

const saveEdits = async () => {
  validationError.value = '';
  if (!hasRequiredRules.value) {
    validationError.value = 'Select at least one broken rule.';
    return;
  }

  const editDetails = buildActivityComment();
  if (props.targetType === 'comment') {
    await updateComment({
      updateCommentInput: {
        text: bodyValue.value,
        editReason: editDetails,
      },
      commentWhere: { id: props.commentId },
    });
    if (updateCommentError.value) return;
  } else if (
    props.targetType === 'discussion' ||
    props.targetType === 'download'
  ) {
    await updateDiscussion({
      where: { id: props.discussionId },
      updateDiscussionInput: {
        title: titleValue.value,
        body: bodyValue.value,
        editReason: editDetails,
      },
    });
    if (updateDiscussionError.value) return;
  } else if (props.targetType === 'event') {
    await updateEvent({
      updateEventInput: {
        title: titleValue.value,
        description: bodyValue.value,
        editReason: editDetails,
      },
      where: { id: props.eventId },
      channelConnections: [],
      channelDisconnections: [],
    });
    if (updateEventError.value) return;
  }

  if (props.targetType === 'event') {
    const actionSummary = 'edited the event.';

    await addFeedItem({
      issueId: props.issueId,
      actionDescription: `${modProfileNameVar.value} ${actionSummary}`,
      actionType: 'EDIT_CONTENT',
      displayName: modProfileNameVar.value || '',
      commentText: editDetails,
      channelUniqueName: props.channelUniqueName,
      flaggedServerRuleViolation: true,
    });
    if (addFeedItemError.value) return;
  } else {
    await updateIssue({
      issueWhere: { id: props.issueId },
      updateIssueInput: { flaggedServerRuleViolation: true },
    });
    if (updateIssueError.value) return;
  }

  emit('saved');
  emit('close');
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
          <p class="font-semibold text-sm text-gray-800 dark:text-gray-100">
            Select broken rules
          </p>
          <SelectBrokenRules
            :selected-forum-rules="selectedForumRules"
            :selected-server-rules="selectedServerRules"
            @toggle-forum-rule-selection="
              (rule) => toggleSelection('forum', rule)
            "
            @toggle-server-rule-selection="
              (rule) => toggleSelection('server', rule)
            "
          />
        </div>

        <div class="space-y-2">
          <p class="font-semibold text-sm text-gray-800 dark:text-gray-100">
            Edit reason
          </p>
          <TextEditor
            :rows="3"
            :placeholder="'Briefly explain the edit for audit/history'"
            :initial-value="editReason"
            :disable-toolbar="true"
            @update="updateEditReason"
          />
        </div>

        <div v-if="targetType !== 'comment'" class="space-y-2">
          <p class="font-semibold text-sm text-gray-800 dark:text-gray-100">
            Title
          </p>
          <TextEditor
            :rows="2"
            :placeholder="'Update the title...'"
            :initial-value="titleValue"
            :disable-toolbar="true"
            @update="updateTitleValue"
          />
        </div>

        <div class="space-y-2">
          <p class="font-semibold text-sm text-gray-800 dark:text-gray-100">
            {{ targetType === 'event' ? 'Description' : 'Body' }}
          </p>
          <TextEditor
            :rows="8"
            :placeholder="'Update the content...'"
            :initial-value="bodyValue"
            @update="updateBodyValue"
          />
        </div>

        <p
          v-if="validationError"
          class="text-sm text-red-600 dark:text-red-400"
        >
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
            class="font-semibold flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-500"
            :disabled="isLoading"
            @click="saveEdits"
          >
            <ButtonContent :loading="isLoading">
              <span class="inline-flex items-center gap-2">
                <PencilIcon class="h-4 w-4" />
                Save edits
              </span>
            </ButtonContent>
          </button>
        </div>
      </div>
    </template>
  </GenericModal>
</template>

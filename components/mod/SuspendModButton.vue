<script lang="ts" setup>
import { computed } from 'vue';
import type { PropType } from 'vue';
import UserPlus from '../icons/UserPlus.vue';
import UserMinus from '../icons/UserMinus.vue';
import Notification from '@/components/NotificationComponent.vue';
import { useQuery } from '@vue/apollo-composable';
import { IS_ORIGINAL_POSTER_SUSPENDED } from '@/graphQLData/mod/queries';
import type { Issue } from '@/__generated__/graphql';
import SuspendModModal from '@/components/mod/SuspendModModal.vue';
import UnsuspendModModal from '@/components/mod/UnsuspendModModal.vue';
import { useSuspensionActionUI } from '@/composables/useSuspensionActionUI';

const props = defineProps({
  issue: {
    type: Object as PropType<Issue>,
    required: true,
  },
  disabled: {
    type: Boolean,
    required: false,
    default: false,
  },
});

defineEmits(['suspended-successfully', 'unsuspended-successfully']);

const {
  result: getModSuspensionResult,
  loading: getModSuspensionLoading,
  error: getModSuspensionError,
} = useQuery(
  IS_ORIGINAL_POSTER_SUSPENDED,
  {
    issueId: props.issue.id,
  },
  {
    enabled:
      !!props.issue.id &&
      (!!props.issue.relatedDiscussionId ||
        !!props.issue.relatedEventId ||
        !!props.issue.relatedCommentId),
  }
);

const modIsSuspendedFromChannel = computed(() => {
  if (getModSuspensionLoading.value || getModSuspensionError.value) {
    return false;
  }
  return getModSuspensionResult.value?.isOriginalPosterSuspended ?? false;
});

const {
  showSuspendModal,
  showUnsuspendModal,
  showSuccessfullySuspended,
  showSuccessfullyUnsuspended,
  openSuspendModal,
  openUnsuspendModal,
  closeSuspendModal,
  closeUnsuspendModal,
  handleSuspendedSuccessfully,
  handleUnsuspendedSuccessfully,
  dismissSuspendedNotification,
  dismissUnsuspendedNotification,
} = useSuspensionActionUI({
  isDisabled: () => props.disabled,
});
</script>

<template>
  <div>
    <button
      v-if="modIsSuspendedFromChannel"
      class="font-semibold flex w-full items-center justify-center gap-2 rounded px-4 py-2 text-sm text-white"
      :class="{
        'cursor-pointer bg-green-600 hover:bg-green-500': !disabled,
        'cursor-not-allowed bg-gray-500': disabled,
      }"
      @click="openUnsuspendModal"
    >
      <UserPlus class="h-6 w-6" />
      Unsuspend Mod
    </button>
    <button
      v-else
      class="font-semibold flex w-full items-start justify-center gap-2 rounded px-4 py-2 text-left text-sm text-white"
      :class="{
        'cursor-pointer bg-red-600 hover:bg-red-500': !disabled,
        'cursor-not-allowed bg-gray-500': disabled,
      }"
      @click="openSuspendModal"
    >
      <span class="flex shrink-0 self-start">
        <UserMinus />
      </span>
      <span>Suspend Mod</span>
    </button>
    <SuspendModModal
      :title="'Suspend Mod'"
      :open="showSuspendModal"
      :issue-id="issue.id"
      @close="closeSuspendModal"
      @suspended-successfully="
        () => {
          handleSuspendedSuccessfully();
          $emit('suspended-successfully');
        }
      "
    />
    <UnsuspendModModal
      :title="'Unsuspend Mod'"
      :open="showUnsuspendModal"
      :issue-id="issue.id"
      @close="closeUnsuspendModal"
      @unsuspended-successfully="
        () => {
          handleUnsuspendedSuccessfully();
          $emit('unsuspended-successfully');
        }
      "
    />
    <Notification
      :show="showSuccessfullySuspended"
      :title="'The mod was suspended.'"
      @close-notification="dismissSuspendedNotification"
    />
    <Notification
      :show="showSuccessfullyUnsuspended"
      :title="'The mod was unsuspended.'"
      @close-notification="dismissUnsuspendedNotification"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import GenericModal from '@/components/GenericModal.vue';
import LockClosedIcon from '@/components/icons/LockClosedIcon.vue';
import { LOCK_CHANNEL } from '@/graphQLData/channel/mutations';

const props = defineProps<{
  channelUniqueName: string;
  channelDisplayName?: string;
  open: boolean;
  issueId?: string;
}>();

const emit = defineEmits<{
  (e: 'close' | 'locked'): void;
}>();

const lockReason = ref('');

const {
  mutate: lockChannel,
  loading: lockChannelLoading,
  error: lockChannelError,
  onDone: lockChannelDone,
} = useMutation(LOCK_CHANNEL, {
  update: (cache) => {
    // Update the channel's locked status in cache
    cache.modify({
      id: cache.identify({
        __typename: 'Channel',
        uniqueName: props.channelUniqueName,
      }),
      fields: {
        locked() {
          return true;
        },
      },
    });
  },
});

lockChannelDone(() => {
  lockReason.value = '';
  emit('locked');
});

const submit = () => {
  if (!lockReason.value.trim()) {
    return;
  }

  lockChannel({
    channelUniqueName: props.channelUniqueName,
    reason: lockReason.value,
    issueId: props.issueId || null,
  });
};

const close = () => {
  lockReason.value = '';
  emit('close');
};

const displayName = props.channelDisplayName || props.channelUniqueName;
</script>

<template>
  <GenericModal
    data-testid="lock-channel-dialog"
    :highlight-color="'yellow'"
    :title="`Lock Forum: ${displayName}`"
    :body="''"
    :open="open"
    :primary-button-text="'Lock Forum'"
    :secondary-button-text="'Cancel'"
    :loading="lockChannelLoading"
    :primary-button-disabled="!lockReason.trim()"
    :error="lockChannelError?.message"
    @primary-button-click="submit"
    @close="close"
  >
    <template #icon>
      <LockClosedIcon
        class="h-6 w-6 text-yellow-600 dark:text-yellow-400"
        aria-hidden="true"
      />
    </template>
    <template #content>
      <div
        class="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm dark:border-yellow-600 dark:bg-yellow-900/20"
      >
        <p class="font-medium text-yellow-800 dark:text-yellow-200">
          Locking a forum will:
        </p>
        <ul
          class="mt-2 list-inside list-disc text-yellow-700 dark:text-yellow-300"
        >
          <li>Prevent new discussions, events, and comments</li>
          <li>Keep existing content visible to readers</li>
          <li>Prevent forum admins from editing settings</li>
        </ul>
      </div>

      <label
        for="lock-reason"
        class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Reason for locking (required)
      </label>
      <textarea
        id="lock-reason"
        v-model="lockReason"
        class="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        rows="3"
        placeholder="Enter the reason for locking this forum..."
      />
    </template>
  </GenericModal>
</template>

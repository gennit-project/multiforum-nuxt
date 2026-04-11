<script lang="ts" setup>
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import GenericModal from '@/components/GenericModal.vue';
import LockOpenIcon from '@/components/icons/LockOpenIcon.vue';
import { UNLOCK_CHANNEL } from '@/graphQLData/channel/mutations';

const props = defineProps<{
  channelUniqueName: string;
  channelDisplayName?: string;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'close' | 'unlocked'): void;
}>();

const unlockReason = ref('');

const {
  mutate: unlockChannel,
  loading: unlockChannelLoading,
  error: unlockChannelError,
  onDone: unlockChannelDone,
} = useMutation(UNLOCK_CHANNEL, {
  update: (cache) => {
    // Update the channel's locked status in cache
    cache.modify({
      id: cache.identify({
        __typename: 'Channel',
        uniqueName: props.channelUniqueName,
      }),
      fields: {
        locked() {
          return false;
        },
        lockedAt() {
          return null;
        },
        lockReason() {
          return null;
        },
      },
    });
  },
});

unlockChannelDone(() => {
  unlockReason.value = '';
  emit('unlocked');
});

const submit = () => {
  unlockChannel({
    channelUniqueName: props.channelUniqueName,
    reason: unlockReason.value || null,
  });
};

const close = () => {
  unlockReason.value = '';
  emit('close');
};

const displayName = props.channelDisplayName || props.channelUniqueName;
</script>

<template>
  <GenericModal
    data-testid="unlock-channel-dialog"
    :highlight-color="'yellow'"
    :title="`Unlock Forum: ${displayName}`"
    :body="''"
    :open="open"
    :primary-button-text="'Unlock Forum'"
    :secondary-button-text="'Cancel'"
    :loading="unlockChannelLoading"
    :primary-button-disabled="false"
    :error="unlockChannelError?.message"
    @primary-button-click="submit"
    @close="close"
  >
    <template #icon>
      <LockOpenIcon
        class="h-6 w-6 text-yellow-600 dark:text-yellow-400"
        aria-hidden="true"
      />
    </template>
    <template #content>
      <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
        This will re-enable new discussions, events, and comments in this forum.
      </p>

      <label
        for="unlock-reason"
        class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Reason for unlocking (optional)
      </label>
      <textarea
        id="unlock-reason"
        v-model="unlockReason"
        class="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        rows="3"
        placeholder="Enter the reason for unlocking this forum..."
      />
    </template>
  </GenericModal>
</template>

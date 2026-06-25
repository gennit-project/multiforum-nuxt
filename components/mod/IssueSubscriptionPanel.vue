<script setup lang="ts">
import GenericButton from '@/components/GenericButton.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';

defineProps({
  isSubscribed: {
    type: Boolean,
    default: false,
  },
  subscribeLoading: {
    type: Boolean,
    default: false,
  },
  unsubscribeLoading: {
    type: Boolean,
    default: false,
  },
  /** Whether to show the one-time "subscribe?" call-to-action prompt. */
  showCta: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['toggle', 'dismiss-cta']);
</script>

<template>
  <div
    class="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60"
  >
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h2 class="text-base font-semibold">Issue notifications</h2>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Subscribe to replies and moderator updates on this issue.
        </p>
      </div>
      <GenericButton
        :text="isSubscribed ? 'Unsubscribe' : 'Subscribe'"
        :loading="subscribeLoading || unsubscribeLoading"
        :active="isSubscribed"
        test-id="toggle-issue-subscription"
        @click="$emit('toggle')"
      />
    </div>

    <div
      v-if="showCta && !isSubscribed"
      class="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm dark:border-orange-500/40 dark:bg-orange-500/10"
    >
      <p class="font-medium text-gray-900 dark:text-gray-100">
        Subscribe to updates on this issue?
      </p>
      <p class="mt-1 text-gray-700 dark:text-gray-300">
        You can get notifications for replies and moderator actions.
      </p>
      <div class="mt-3 flex gap-2">
        <PrimaryButton
          :label="'Subscribe'"
          :loading="subscribeLoading"
          @click="$emit('toggle')"
        />
        <GenericButton :text="'Not now'" @click="$emit('dismiss-cta')" />
      </div>
    </div>
  </div>
</template>

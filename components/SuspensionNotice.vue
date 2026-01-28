<script setup lang="ts">
import ErrorBanner from '@/components/ErrorBanner.vue';

const props = defineProps({
  issueNumber: {
    type: Number,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  suspendedUntil: {
    type: String,
    default: null,
  },
  suspendedIndefinitely: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: 'You are suspended and cannot complete this action.',
  },
});
</script>

<template>
  <div>
    <ErrorBanner :text="message" />
    <div class="text-sm text-red-600 dark:text-red-300">
      <nuxt-link
        :to="`/forums/${props.channelId}/issues/${props.issueNumber}`"
        class="underline"
      >
        View Issue #{{ props.issueNumber }}
      </nuxt-link>
      <span v-if="props.suspendedIndefinitely">
        · Suspension is indefinite.
      </span>
      <span v-else-if="props.suspendedUntil">
        · Suspension expires on
        {{ new Date(props.suspendedUntil).toISOString().slice(0, 10) }}.
      </span>
    </div>
  </div>
</template>

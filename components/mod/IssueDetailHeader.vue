<script setup lang="ts">
import { computed } from 'vue';
import type { Issue } from '@/__generated__/graphql';
import GenericButton from '@/components/GenericButton.vue';
import ArrowPathIcon from '@/components/icons/ArrowPath.vue';
import BellIcon from '@/components/icons/BellIcon.vue';
import BellSlashIcon from '@/components/icons/BellSlashIcon.vue';
import CheckCircleIcon from '@/components/icons/CheckCircleIcon.vue';
import ChatBubbleBottomCenter from '@/components/icons/ChatBubbleBottomCenter.vue';
import DotCircleIcon from '@/components/icons/DotCircleIcon.vue';
import LockClosedIcon from '@/components/icons/LockClosedIcon.vue';
import LockOpenIcon from '@/components/icons/LockOpenIcon.vue';
import XCircleIcon from '@/components/icons/XCircleIcon.vue';

const props = withDefaults(
  defineProps<{
    issue: Issue;
    contextChannels?: string[];
    showSummary?: boolean;
    showActions?: boolean;
    isSubscribed?: boolean;
    subscriptionLoading?: boolean;
    isSuspendedMod?: boolean;
    closeIssueLoading?: boolean;
    reopenIssueLoading?: boolean;
    lockIssueLoading?: boolean;
    unlockIssueLoading?: boolean;
  }>(),
  {
    contextChannels: () => [],
    showSummary: true,
    showActions: false,
    isSubscribed: false,
    subscriptionLoading: false,
    isSuspendedMod: false,
    closeIssueLoading: false,
    reopenIssueLoading: false,
    lockIssueLoading: false,
    unlockIssueLoading: false,
  }
);

const emit = defineEmits<{
  (
    e:
      | 'toggleSubscription'
      | 'toggleCloseOpen'
      | 'openLockDialog'
      | 'unlockIssue'
  ): void;
}>();

const authorLabel = computed(() => {
  const author = props.issue.Author;
  if (author?.__typename === 'User') return author.username;
  if (author?.__typename === 'ModerationProfile') return author.displayName;
  return 'Unknown author';
});

const createdAtLabel = computed(() => {
  if (!props.issue.createdAt) return '';
  const date = new Date(props.issue.createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
});

const issueNumberLabel = computed(() =>
  props.issue.issueNumber ? `#${props.issue.issueNumber}` : ''
);
</script>

<template>
  <header
    class="border-b border-gray-200 bg-white px-4 py-4 lg:sticky lg:top-0 lg:z-20 dark:border-gray-700 dark:bg-gray-900"
    data-testid="issue-detail-header"
  >
    <div class="flex flex-col gap-4">
      <div
        v-if="showSummary"
        class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <div class="min-w-0 space-y-2">
          <div
            class="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
          >
            <span
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold"
              :class="
                issue.isOpen
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-100'
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-100'
              "
              aria-live="polite"
            >
              <DotCircleIcon
                v-if="issue.isOpen"
                class="h-4 w-4"
                aria-hidden="true"
              />
              <CheckCircleIcon v-else class="h-4 w-4" aria-hidden="true" />
              {{ issue.isOpen ? 'Open' : 'Closed' }}
            </span>
            <span
              v-if="issue.locked"
              class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-900 dark:bg-amber-900/50 dark:text-amber-100"
            >
              <LockClosedIcon class="h-4 w-4" aria-hidden="true" />
              Locked
            </span>
            <span v-if="issueNumberLabel" class="font-medium">{{
              issueNumberLabel
            }}</span>
          </div>

          <h1
            class="text-2xl leading-tight font-bold text-gray-950 dark:text-white"
          >
            {{ issue.title || `Issue ${issueNumberLabel}` }}
          </h1>

          <p class="text-sm text-gray-600 dark:text-gray-300">
            Reported by
            <span class="font-medium text-gray-900 dark:text-gray-100">{{
              authorLabel
            }}</span>
            <template v-if="createdAtLabel">
              on <time :datetime="issue.createdAt">{{ createdAtLabel }}</time>
            </template>
          </p>

          <nav
            v-if="contextChannels.length"
            data-testid="issue-detail-channel-tags"
            aria-label="Issue channels"
            class="flex flex-wrap gap-2"
          >
            <NuxtLink
              v-for="channelName in contextChannels"
              :key="channelName"
              :to="`/forums/${channelName}`"
              class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800 hover:bg-gray-200 hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              {{ channelName }}
            </NuxtLink>
          </nav>
        </div>
      </div>

      <div
        v-if="showActions"
        role="group"
        aria-label="Issue actions"
        class="flex flex-wrap items-center gap-2"
        :class="
          showSummary
            ? 'border-t border-gray-200 pt-3 dark:border-gray-700'
            : ''
        "
      >
        <a
          v-if="issue.isOpen && !issue.locked"
          href="#issue-comment-composer"
          class="focus:ring-brand-500 inline-flex min-h-10 items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:text-gray-950 dark:hover:bg-blue-400"
        >
          <ChatBubbleBottomCenter class="h-4 w-4" aria-hidden="true" />
          Reply
        </a>

        <GenericButton
          :text="isSubscribed ? 'Unsubscribe' : 'Subscribe'"
          :active="isSubscribed"
          :loading="subscriptionLoading"
          test-id="toggle-issue-subscription"
          @click="emit('toggleSubscription')"
        >
          <BellSlashIcon
            v-if="isSubscribed"
            class="h-4 w-4"
            aria-hidden="true"
          />
          <BellIcon v-else class="h-4 w-4" aria-hidden="true" />
        </GenericButton>

        <GenericButton
          :text="issue.isOpen ? 'Close issue' : 'Reopen issue'"
          :loading="closeIssueLoading || reopenIssueLoading"
          :disabled="isSuspendedMod || closeIssueLoading || reopenIssueLoading"
          test-id="close-open-issue-button"
          @click="emit('toggleCloseOpen')"
        >
          <XCircleIcon v-if="issue.isOpen" class="h-4 w-4" aria-hidden="true" />
          <ArrowPathIcon v-else class="h-4 w-4" aria-hidden="true" />
        </GenericButton>

        <GenericButton
          v-if="!issue.locked"
          text="Lock issue"
          :loading="lockIssueLoading"
          :disabled="isSuspendedMod || lockIssueLoading"
          @click="emit('openLockDialog')"
        >
          <LockClosedIcon class="h-4 w-4" aria-hidden="true" />
        </GenericButton>
        <GenericButton
          v-else
          text="Unlock issue"
          :loading="unlockIssueLoading"
          :disabled="isSuspendedMod || unlockIssueLoading"
          @click="emit('unlockIssue')"
        >
          <LockOpenIcon class="h-4 w-4" aria-hidden="true" />
        </GenericButton>
      </div>
    </div>
  </header>
</template>

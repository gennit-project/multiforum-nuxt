<script setup lang="ts">
import { computed } from 'vue';
import type { Issue as GeneratedIssue } from '@/__generated__/graphql';
import { DateTime } from 'luxon';
import FlagIcon from '@/components/icons/FlagIcon.vue';
import ChannelIconStack from '@/components/channel/ChannelIconStack.vue';
import TagComponent from '@/components/TagComponent.vue';

// Client-only fields the list view denormalizes onto the issue before passing
// it in; they are not part of the generated GraphQL Issue schema.
type Issue = GeneratedIssue & {
  channelIconURL?: string | null;
  reportCount?: number | null;
};

const props = defineProps({
  issue: {
    type: Object as () => Issue,
    required: true,
  },
  isSelectable: {
    type: Boolean,
    default: false,
  },
  selectedIssueNumber: {
    type: Number,
    default: null,
  },
  showStatusIcon: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits<{
  select: [payload: { issueNumber: number; title: string; channelId: string }];
}>();

const formatDate = (date: string) => {
  return DateTime.fromISO(date).toLocaleString(DateTime.DATE_FULL);
};

const issueAuthorName = (issue: Issue) => {
  if (issue.authorName) {
    return issue.authorName;
  }

  if (issue.Author?.__typename === 'ModerationProfile') {
    return issue.Author.displayName || '[Deleted]';
  }

  if (issue.Author?.__typename === 'User') {
    return issue.Author.username || '[Deleted]';
  }

  return '[Deleted]';
};

const reportCount = computed(() => {
  const count =
    props.issue?.reportCount ?? props.issue?.ActivityFeedAggregate?.count;
  return typeof count === 'number' ? count : null;
});

const reportCountLabel = computed(() => {
  if (reportCount.value === null) return '';
  return `${reportCount.value} ${reportCount.value === 1 ? 'report' : 'reports'}`;
});

const handleSelect = () => {
  const channelId =
    props.issue.Channel?.uniqueName || props.issue.channelUniqueName;
  if (!props.issue?.issueNumber || !channelId) return;
  emit('select', {
    issueNumber: props.issue.issueNumber,
    title: props.issue.title || '',
    channelId,
  });
};

const isSelected = computed(() => {
  return props.selectedIssueNumber === props.issue?.issueNumber;
});

// Check if the related content is from a bot (based on username prefix convention)
const isRelatedToBot = computed(() => {
  const username = props.issue?.relatedUsername;
  return typeof username === 'string' && username.startsWith('bot-');
});

const isRelatedToWiki = computed(() => {
  return !!props.issue.relatedWikiPageId || !!props.issue.relatedWikiRevisionId;
});

const relatedChannels = computed(() => {
  const uniqueName =
    props.issue?.Channel?.uniqueName || props.issue?.channelUniqueName;

  if (uniqueName) {
    return [
      {
        uniqueName,
        iconURL:
          props.issue.Channel?.channelIconURL || props.issue.channelIconURL || '',
      },
    ];
  }

  return [];
});

const relatedChannelNames = computed(() =>
  relatedChannels.value.map((channel) => channel.uniqueName)
);
</script>

<template>
  <li
    class="border-bottom flex flex-col border-gray-200 p-3 pl-4 dark:border-gray-800"
  >
    <div class="flex space-x-2 text-sm md:text-lg">
      <i
        v-if="showStatusIcon && issue.isOpen"
        class="far fa-dot-circle list-item-icon mt-1"
      />
      <i
        v-else-if="showStatusIcon"
        class="fa-solid fa-circle-check mt-1 text-purple-500"
      />

      <ChannelIconStack
        v-if="relatedChannels.length"
        :channels="relatedChannels"
        class="mt-0.5 shrink-0"
        icon-class="h-6 w-6 shrink-0 rounded-full ring-2 ring-white dark:ring-gray-900"
        tooltip-position-class="pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover/chicon:opacity-100 dark:bg-gray-700"
        :show-extra-count="false"
      />

      <div class="flex-col">
        <span
          v-if="issue.Channel || issue.channelUniqueName"
          class="flex flex-wrap items-center gap-2"
        >
          <nuxt-link
            v-if="issue.issueNumber"
            class="hover:underline dark:text-gray-200 lg:hidden"
            :to="{
              name: 'forums-forumId-issues-issueNumber',
              params: {
                issueNumber: issue.issueNumber,
                forumId: issue.Channel?.uniqueName || issue.channelUniqueName,
              },
            }"
            @click="handleSelect"
          >
            {{ issue.title }}
          </nuxt-link>
          <button
            v-if="issue.issueNumber"
            type="button"
            class="hidden text-left hover:underline dark:text-gray-200 lg:inline-block"
            @click="handleSelect"
          >
            <span
              :class="
                isSelected
                  ? 'rounded bg-gray-100 px-1 dark:bg-gray-700'
                  : ''
              "
            >
              {{ issue.title }}
            </span>
          </button>
          <span v-else class="dark:text-gray-200">{{ issue.title }}</span>
          <span
            v-if="issue.locked"
            class="inline-flex items-center gap-1 rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-100"
            title="This issue is locked"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clip-rule="evenodd"
              />
            </svg>
            Locked
          </span>
          <span
            v-if="issue.flaggedServerRuleViolation"
            class="rounded-lg bg-gray-200 px-2 py-1 text-xs dark:bg-gray-700 dark:text-white"
            >Server Rule Violation</span
          >
          <span
            v-if="reportCount !== null && reportCount > 0"
            class="inline-flex items-center gap-1 rounded-full bg-red-200 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/70 dark:text-red-100"
          >
            <FlagIcon class="h-3 w-3" aria-hidden="true" />
            {{ reportCountLabel }}
          </span>
          <span
            v-if="isRelatedToBot"
            class="rounded-full bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/70 dark:text-blue-100"
          >
            🤖 Bot
          </span>
          <span
            v-if="isRelatedToWiki"
            class="rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-100"
          >
            Wiki Edit
          </span>
        </span>
        <div v-else class="dark:text-gray-200">{{ issue.title }}</div>
        <div
          v-if="relatedChannelNames.length"
          class="mt-2 flex flex-wrap gap-1"
          data-testid="issue-channel-tags"
        >
          <TagComponent
            v-for="channelName in relatedChannelNames"
            :key="channelName"
            class="dark:!text-white"
            :tag="channelName"
            :hide-icon="true"
            :channel-mode="true"
          />
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-200">
          {{
            `Opened on ${formatDate(issue.createdAt)} by ${issueAuthorName(
              issue
            )} in ${issue.Channel?.uniqueName || issue.channelUniqueName || '[Deleted]'}`
          }}
        </div>
      </div>
    </div>
  </li>
</template>

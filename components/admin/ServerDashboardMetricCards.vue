<script setup lang="ts">
import { computed } from 'vue';
import type { ServerHealthSummary } from '@/__generated__/graphql';

type MetricSummary = Pick<
  ServerHealthSummary,
  | 'activeChannelCount'
  | 'discussionCount'
  | 'commentCount'
  | 'eventCount'
  | 'voteCount'
  | 'openIssueCount'
  | 'issueOpenedCount'
  | 'issueClosedCount'
  | 'moderationActionCount'
  | 'medianOpenIssueAgeDays'
>;

const props = defineProps<{
  summary: MetricSummary;
  /** Total channels returned by the channel health query, when known. */
  channelCount?: number | null;
}>();

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${formatNumber(count)} ${count === 1 ? singular : plural}`;

const totalContributions = computed(
  () =>
    props.summary.discussionCount +
    props.summary.commentCount +
    props.summary.eventCount
);

const medianAgeLabel = computed(() => {
  const age = props.summary.medianOpenIssueAgeDays;
  if (props.summary.openIssueCount === 0 || age == null) return null;
  return `median age ${pluralize(Math.round(age), 'day')}`;
});

const metricCards = computed(() => [
  {
    key: 'contributions',
    label: 'Contributions',
    value: formatNumber(totalContributions.value),
    detail: [
      pluralize(props.summary.discussionCount, 'discussion'),
      pluralize(props.summary.commentCount, 'comment'),
      pluralize(props.summary.eventCount, 'event'),
    ].join(' · '),
  },
  {
    key: 'active-channels',
    label: 'Active channels',
    value: formatNumber(props.summary.activeChannelCount),
    valueSuffix:
      props.channelCount && props.channelCount >= props.summary.activeChannelCount
        ? `of ${formatNumber(props.channelCount)}`
        : null,
    detail: `${pluralize(props.summary.voteCount, 'vote')} cast`,
  },
  {
    key: 'open-issues',
    label: 'Open admin issues',
    value: formatNumber(props.summary.openIssueCount),
    detail: [
      `${formatNumber(props.summary.issueOpenedCount)} opened this period`,
      medianAgeLabel.value,
    ]
      .filter(Boolean)
      .join(' · '),
  },
  {
    key: 'moderation-actions',
    label: 'Moderation actions',
    value: formatNumber(props.summary.moderationActionCount),
    detail: `${pluralize(props.summary.issueClosedCount, 'issue')} closed`,
  },
]);
</script>

<template>
  <section aria-label="Key numbers" class="flex flex-wrap gap-4">
    <div
      v-for="card in metricCards"
      :key="card.key"
      :data-testid="`metric-card-${card.key}`"
      class="min-w-60 flex-1 rounded-xl border border-gray-200 bg-white p-5 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100"
    >
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
        {{ card.label }}
      </p>
      <p
        class="mt-1.5 text-3xl font-semibold tracking-tight !text-gray-900 dark:!text-gray-100"
      >
        {{ card.value }}
        <span
          v-if="card.valueSuffix"
          class="text-lg font-medium text-gray-600 dark:text-gray-400"
        >
          {{ card.valueSuffix }}
        </span>
      </p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {{ card.detail }}
      </p>
    </div>
  </section>
</template>

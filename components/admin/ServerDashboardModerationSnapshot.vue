<script setup lang="ts">
import { computed } from 'vue';
import type { ServerHealthSummary } from '@/__generated__/graphql';

const props = defineProps<{
  summary: Pick<
    ServerHealthSummary,
    | 'suspensionCount'
    | 'archivedContentCount'
    | 'lockedContentCount'
    | 'downloadCount'
  >;
}>();

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);

const rows = computed(() => [
  {
    key: 'suspensions',
    label: 'Active suspensions',
    value: props.summary.suspensionCount,
    to: '/admin/suspensions',
  },
  {
    key: 'archived',
    label: 'Archived content',
    value: props.summary.archivedContentCount,
    to: null,
  },
  {
    key: 'locked',
    label: 'Locked content',
    value: props.summary.lockedContentCount,
    to: null,
  },
  {
    key: 'downloads',
    label: 'Downloads',
    value: props.summary.downloadCount,
    to: null,
  },
]);
</script>

<template>
  <section
    aria-labelledby="moderation-snapshot-heading"
    data-testid="moderation-snapshot"
    class="min-w-0 rounded-xl border border-gray-200 bg-white p-5 !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100"
  >
    <h2
      id="moderation-snapshot-heading"
      class="mb-3 text-base font-semibold !text-gray-900 dark:!text-gray-100"
    >
      Moderation snapshot
    </h2>
    <dl class="m-0 flex flex-col">
      <div
        v-for="row in rows"
        :key="row.key"
        class="flex items-center justify-between gap-3 border-t border-gray-200 py-2.5 dark:border-gray-800"
      >
        <dt class="text-gray-700 dark:text-gray-300">{{ row.label }}</dt>
        <dd class="m-0 font-semibold">
          <NuxtLink
            v-if="row.to"
            :to="row.to"
            class="underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {{ formatNumber(row.value) }}
          </NuxtLink>
          <template v-else>{{ formatNumber(row.value) }}</template>
        </dd>
      </div>
    </dl>
  </section>
</template>

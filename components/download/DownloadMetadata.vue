<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import type { FilterOption } from '@/__generated__/graphql';
import { GET_DOWNLOAD_LABELS } from '@/graphQLData/discussion/queries';

const props = defineProps({
  discussionId: {
    type: String,
    required: true,
  },
  channelUniqueName: {
    type: String,
    required: true,
  },
});

const { result: labelQueryResult } = useQuery(
  GET_DOWNLOAD_LABELS,
  {
    discussionId: props.discussionId,
    channelUniqueName: props.channelUniqueName,
  },
  {
    enabled: !!props.discussionId && !!props.channelUniqueName,
  }
);

const labelOptions = computed<FilterOption[]>(() => {
  return (
    labelQueryResult.value?.discussions?.[0]?.DiscussionChannels?.[0]
      ?.LabelOptions || []
  );
});

const groupedLabels = computed(() => {
  const groups: Record<
    string,
    {
      displayName: string;
      labels: Array<{ value: string; displayName: string }>;
    }
  > = {};

  labelOptions.value.forEach((option) => {
    const groupKey = option.group?.key;
    const groupDisplayName = option.group?.displayName;

    if (!groupKey || !groupDisplayName || groupKey === 'license') return;

    if (!groups[groupKey]) {
      groups[groupKey] = { displayName: groupDisplayName, labels: [] };
    }
    groups[groupKey].labels.push({
      value: option.value || '',
      displayName: option.displayName || option.value || '',
    });
  });

  return groups;
});
</script>

<template>
  <section
    v-if="Object.keys(groupedLabels).length > 0"
    class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
    data-testid="download-metadata"
  >
    <h2 class="font-semibold mb-3 text-sm text-gray-900 dark:text-white">
      Metadata
    </h2>
    <dl class="space-y-3">
      <div
        v-for="(group, groupKey) in groupedLabels"
        :key="groupKey"
        class="flex flex-wrap items-center gap-2 text-sm"
      >
        <dt class="font-medium text-gray-700 dark:text-gray-300">
          {{ group.displayName }}:
        </dt>
        <dd class="flex flex-wrap gap-2">
          <span
            v-for="label in group.labels"
            :key="`${groupKey}-${label.value}`"
            class="rounded-full bg-gray-100 px-2 py-1 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >
            {{ label.displayName }}
          </span>
        </dd>
      </div>
    </dl>
  </section>
</template>

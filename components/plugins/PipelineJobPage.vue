<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GetPipelineRunPageDocument as GET_PLUGIN_PIPELINE_RUN_PAGE } from '@/__generated__/operations';
import type { PublicPluginPipelineRunPage } from '@/composables/usePipelineHistory';

const props = defineProps<{ attempt: PublicPluginPipelineRunPage }>();
const emit = defineEmits<{ update: [PublicPluginPipelineRunPage] }>();
const after = ref<string | null>(null);
const { result, loading, error, refetch, onResult } = useQuery(
  GET_PLUGIN_PIPELINE_RUN_PAGE,
  () => ({ pipelineRunId: props.attempt.run.id, after: after.value }),
  () => ({
    enabled: !!after.value || props.attempt.hasActiveWork,
    fetchPolicy: 'no-cache',
    prefetch: false,
    pollInterval: props.attempt.hasActiveWork ? 3000 : 0,
  })
);
watch(
  () => props.attempt.run.id,
  () => {
    after.value = null;
    result.value = undefined;
  }
);
onResult(({ data, loading }) => {
  const page = data?.getPipelineRunPage;
  if (loading || !page || page.run.id !== props.attempt.run.id) return;
  const jobs = new Map(props.attempt.run.jobs.map((job) => [job.id, job]));
  for (const job of page.run.jobs) jobs.set(job.id, job);
  emit('update', { ...page, run: { ...page.run, jobs: [...jobs.values()] } });
});
const hasMore = computed(() => props.attempt.jobsPageInfo.hasNextPage);
const loadMore = () => {
  if (loading.value) return;
  const cursor = props.attempt.jobsPageInfo.endCursor;
  if (!cursor) return;
  if (cursor === after.value) void refetch()?.catch(() => {});
  else after.value = cursor;
};
</script>
<template>
  <div v-if="hasMore || error" class="p-3">
    <p v-if="error" role="alert" class="text-sm text-red-700 dark:text-red-300">
      Stages could not be loaded. Try again.
    </p>
    <button
      type="button"
      class="text-brand-700 dark:text-brand-300 min-h-11 px-3 text-sm underline disabled:opacity-60"
      :disabled="loading"
      @click="loadMore"
    >
      {{
        loading
          ? 'Loading stages…'
          : error
            ? 'Retry loading stages'
            : 'Load more stages'
      }}
    </button>
    <span role="status" class="sr-only">{{
      loading ? 'Loading stages' : ''
    }}</span>
  </div>
</template>

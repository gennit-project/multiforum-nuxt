import {
  computed,
  onScopeDispose,
  ref,
  shallowRef,
  watch,
  type Ref,
} from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GetPipelineSummaryPageDocument as GET_PLUGIN_PIPELINE_SUMMARY } from '@/__generated__/operations';
import type { GetPipelineSummaryPageQuery, GetPipelineSummaryPageQueryVariables, GetPipelineRunPageQuery } from '@/__generated__/operations';
type PluginPipelineSummaryPage = GetPipelineSummaryPageQuery['getPipelineSummaryPage'];
export type PublicPluginPipelineRunPage = NonNullable<GetPipelineRunPageQuery['getPipelineRunPage']>;

/** The initial page owns current status; continuation requests never replace it. */
export function usePipelineHistory(
  variables: Ref<GetPipelineSummaryPageQueryVariables>,
  enabled: Ref<boolean>,
  pollInterval = 3000
) {
  const identity = computed(() => JSON.stringify(variables.value));
  const after = ref<string | null>(null);
  const older = shallowRef<PublicPluginPipelineRunPage[]>([]);
  const expandedJobs = shallowRef(
    new Map<string, PublicPluginPipelineRunPage>()
  );
  const continuation = shallowRef<PluginPipelineSummaryPage['pageInfo'] | null>(
    null
  );
  const initial = useQuery(
    GET_PLUGIN_PIPELINE_SUMMARY,
    variables,
    () => ({
      enabled: enabled.value,
      fetchPolicy: 'no-cache',
      prefetch: false,
      notifyOnNetworkStatusChange: true,
    })
  );
  const more = useQuery(
    GET_PLUGIN_PIPELINE_SUMMARY,
    () => ({ ...variables.value, after: after.value }),
    () => ({
      enabled: enabled.value && !!after.value,
      fetchPolicy: 'no-cache',
      prefetch: false,
      notifyOnNetworkStatusChange: true,
    })
  );
  // A new first-page insertion must not drop an already loaded attempt between
  // the refreshed first page and the continuation cursor from the previous page.
  let previousFirst: PublicPluginPipelineRunPage[] = [];
  initial.onResult(({ data, loading }) => {
    if (
      loading ||
      data !== initial.result.value ||
      !enabled.value ||
      !data?.getPipelineSummaryPage
    )
      return;
    const next = data.getPipelineSummaryPage;
    if (
      next.targetId !== variables.value.targetId ||
      next.targetType !== variables.value.targetType
    )
      return;
    const currentIds = new Set(next.attempts.map((item) => item.run.id));
    if (after.value) {
      older.value = [
        ...new Map(
          [
            ...previousFirst.filter((item) => !currentIds.has(item.run.id)),
            ...older.value,
          ].map((item) => [item.run.id, item])
        ).values(),
      ];
    }
    previousFirst = next.attempts;
  });
  const page = computed(() =>
    enabled.value ? initial.result.value?.getPipelineSummaryPage : undefined
  );
  const attempts = computed(() => {
    if (!enabled.value) return [];
    const seen = new Set<string>();
    return [...(page.value?.attempts ?? []), ...older.value]
      .filter(({ run }) => !seen.has(run.id) && !!seen.add(run.id))
      .map((page) => {
        const expanded = expandedJobs.value.get(page.run.id);
        if (!expanded) return page;
        const jobs = new Map(expanded.run.jobs.map((job) => [job.id, job]));
        for (const job of page.run.jobs) jobs.set(job.id, job);
        return {
          ...page,
          jobsPageInfo: expanded.jobsPageInfo,
          run: { ...page.run, jobs: [...jobs.values()] },
        };
      });
  });
  more.onResult(({ data, loading }) => {
    if (
      loading ||
      data !== more.result.value ||
      !after.value ||
      !enabled.value ||
      !data?.getPipelineSummaryPage
    )
      return;
    const next = data.getPipelineSummaryPage;
    if (
      next.targetId !== variables.value.targetId ||
      next.targetType !== variables.value.targetType
    )
      return;
    const merged = new Map(older.value.map((item) => [item.run.id, item]));
    for (const item of next.attempts) merged.set(item.run.id, item);
    older.value = [...merged.values()];
    continuation.value = next.pageInfo;
  });
  const reset = () => {
    previousFirst = [];
    after.value = null;
    older.value = [];
    expandedJobs.value = new Map();
    continuation.value = null;
  };
  watch(
    identity,
    () => {
      reset();
      initial.result.value = undefined;
      more.result.value = undefined;
      more.error.value = null;
    },
    { flush: 'sync' }
  );
  const hasActiveWork = computed(() => page.value?.hasActiveWork ?? false);
  const isPolling = computed(
    () => enabled.value && hasActiveWork.value && pollInterval > 0
  );
  watch(
    isPolling,
    (active) => {
      if (active) initial.query.value?.startPolling(pollInterval);
      else initial.query.value?.stopPolling();
    },
    { immediate: true }
  );
  onScopeDispose(() => {
    initial.query.value?.stopPolling();
  });
  const pageInfo = computed(() => continuation.value ?? page.value?.pageInfo);
  const loadMore = () => {
    if (more.loading.value || !pageInfo.value?.hasNextPage) return;
    const cursor = pageInfo.value.endCursor;
    if (!cursor) return;
    if (after.value === cursor) void more.refetch()?.catch(() => {});
    else after.value = cursor;
  };
  const refetch = () => {
    reset();
    return initial.refetch();
  };
  return {
    attempts,
    ready: computed(() => !!page.value),
    hasActiveWork,
    isPolling,
    updateAttempt: (updated: PublicPluginPipelineRunPage) => {
      expandedJobs.value = new Map(expandedJobs.value).set(
        updated.run.id,
        updated
      );
      const data = initial.result.value;
      if (data)
        initial.result.value = {
          getPipelineSummaryPage: {
            ...data.getPipelineSummaryPage,
            attempts: data.getPipelineSummaryPage.attempts.map((item) =>
              item.run.id === updated.run.id ? updated : item
            ),
          },
        };
      older.value = older.value.map((item) =>
        item.run.id === updated.run.id ? updated : item
      );
    },
    loading: initial.loading,
    error: initial.error,
    moreLoading: more.loading,
    moreError: more.error,
    hasMore: computed(() => !!pageInfo.value?.hasNextPage),
    loadMore,
    refetch,
    startPolling: () => initial.query.value?.startPolling(pollInterval),
    stopPolling: () => initial.query.value?.stopPolling(),
  };
}

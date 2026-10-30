import { describe, it, expect, afterEach, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from '@apollo/client/core';
import { DefaultApolloClient } from '@vue/apollo-composable';
import { usePipelineHistory } from './usePipelineHistory';
import {
  pipelinePage,
  pipelineJob,
  pipelineSummary,
} from '@/tests/unit/fixtures/pipelinePage';
import type {
  PluginPipelineSummaryPage,
  QueryGetPipelineSummaryPageArgs,
} from '@/__generated__/graphql';

const cleanups: Array<() => void> = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  vi.useRealTimers();
});
async function setup(pollInterval = 0) {
  const requests: Array<{
    variables: Record<string, unknown>;
    send: (page: PluginPipelineSummaryPage) => void;
    fail: () => void;
    cancelled: boolean;
  }> = [];
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink(
      (operation) =>
        new Observable((observer) => {
          const request = {
            variables: operation.variables,
            send: (page: PluginPipelineSummaryPage) => {
              observer.next({ data: { getPipelineSummaryPage: page } });
              observer.complete();
            },
            fail: () => observer.error(new Error('Network unavailable')),
            cancelled: false,
          };
          requests.push(request);
          return () => {
            request.cancelled = true;
          };
        })
    ),
  });
  const variables = ref<QueryGetPipelineSummaryPageArgs>({
    targetId: 'file-1',
    targetType: 'DownloadableFile',
    channelId: 'cats',
  });
  const enabled = ref(true);
  let history!: ReturnType<typeof usePipelineHistory>;
  const wrapper = mount(
    defineComponent({
      setup() {
        history = usePipelineHistory(variables, enabled, pollInterval);
        return () => h('div');
      },
    }),
    { global: { provide: { [DefaultApolloClient as symbol]: client } } }
  );
  cleanups.push(() => {
    wrapper.unmount();
    client.stop();
  });
  await flushPromises();
  return { requests, history, variables, enabled, wrapper };
}
const firstPage = () =>
  pipelineSummary({
    hasActiveWork: true,
    pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
  });
const olderPage = () => {
  const old = pipelinePage();
  old.run.id = 'old';
  return pipelineSummary({
    attempts: [old],
    pageInfo: { hasNextPage: true, endCursor: 'cursor-2' },
  });
};
describe('bounded pipeline history with Apollo', () => {
  it('retains target-wide activity when the visible attempt passed', async () => {
    const { requests, history } = await setup();
    requests[0]!.send(firstPage());
    await flushPromises();
    expect({
      active: history.hasActiveWork.value,
      status: history.attempts.value[0]?.displayStatus,
    }).toEqual({ active: true, status: 'SUCCEEDED' });
  });
  it('appends distinct attempts and passes the opaque continuation unchanged', async () => {
    const { requests, history } = await setup();
    requests[0]!.send(firstPage());
    await flushPromises();
    history.loadMore();
    await flushPromises();
    requests[1]!.send(olderPage());
    await flushPromises();
    expect({
      after: requests[1]!.variables.after,
      ids: history.attempts.value.map((item) => item.run.id),
    }).toEqual({ after: 'cursor-1', ids: ['attempt-1', 'old'] });
  });
  it('deduplicates overlapping pages across repeated load-more clicks', async () => {
    const { requests, history } = await setup();
    requests[0]!.send(firstPage());
    await flushPromises();
    history.loadMore();
    history.loadMore();
    await flushPromises();
    requests[1]!.send(
      pipelineSummary({
        attempts: [pipelinePage(), olderPage().attempts[0]!],
        pageInfo: { hasNextPage: false, endCursor: 'last' },
      })
    );
    await flushPromises();
    history.loadMore();
    expect({
      requests: requests.length,
      ids: history.attempts.value.map((item) => item.run.id),
      more: history.hasMore.value,
    }).toEqual({ requests: 2, ids: ['attempt-1', 'old'], more: false });
  });
  it('keeps loaded rows and exposes a retryable continuation error', async () => {
    const { requests, history } = await setup();
    requests[0]!.send(firstPage());
    await flushPromises();
    history.loadMore();
    await flushPromises();
    requests[1]!.fail();
    await flushPromises();
    expect({
      ids: history.attempts.value.map((item) => item.run.id),
      error: history.moreError.value?.message,
      more: history.hasMore.value,
    }).toEqual({
      ids: ['attempt-1'],
      error: 'Network unavailable',
      more: true,
    });
  });
  it('retries the same failed cursor', async () => {
    const { requests, history } = await setup();
    requests[0]!.send(firstPage());
    await flushPromises();
    history.loadMore();
    await flushPromises();
    requests[1]!.fail();
    await flushPromises();
    history.loadMore();
    await flushPromises();
    requests[2]!.send(olderPage());
    await flushPromises();
    expect({
      cursor: requests[2]!.variables.after,
      error: history.moreError.value,
      ids: history.attempts.value.map((item) => item.run.id),
    }).toEqual({ cursor: 'cursor-1', error: null, ids: ['attempt-1', 'old'] });
  });
  it('rejects late pages after a channel change on the same target', async () => {
    const { requests, history, variables } = await setup();
    requests[0]!.send(firstPage());
    await flushPromises();
    history.loadMore();
    await flushPromises();
    variables.value = { ...variables.value, channelId: 'dogs' };
    await flushPromises();
    requests[1]!.send(olderPage());
    await flushPromises();
    expect({
      ids: history.attempts.value.map((item) => item.run.id),
      channel: requests.at(-1)?.variables.channelId,
      after: requests.at(-1)?.variables.after,
    }).toEqual({ ids: [], channel: 'dogs', after: undefined });
  });
  it('retains expanded stages when polling replaces the initial page', async () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    });
    const { requests, history } = await setup(100);
    requests[0]!.send(firstPage());
    await flushPromises();
    const expanded = pipelinePage();
    expanded.run.jobs.push(pipelineJob({ id: 'extra' }));
    history.updateAttempt(expanded);
    await vi.advanceTimersByTimeAsync(100);
    requests[1]!.send(firstPage());
    await flushPromises();
    expect(history.attempts.value[0]?.run.jobs.map((job) => job.id)).toEqual([
      'job-1',
      'extra',
    ]);
  });
  it('stops polling once target-wide work finishes', async () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    });
    const { requests, history } = await setup(100);
    requests[0]!.send(firstPage());
    await flushPromises();
    await vi.advanceTimersByTimeAsync(100);
    requests[1]!.send(pipelineSummary());
    await flushPromises();
    await vi.advanceTimersByTimeAsync(500);
    expect({
      count: requests.length,
      polling: history.isPolling.value,
    }).toEqual({ count: 2, polling: false });
  });
  it('stops polling and hides history when disabled', async () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    });
    const { requests, history, enabled } = await setup(100);
    requests[0]!.send(firstPage());
    await flushPromises();
    enabled.value = false;
    await flushPromises();
    await vi.advanceTimersByTimeAsync(500);
    expect({
      count: requests.length,
      polling: history.isPolling.value,
      attempts: history.attempts.value,
    }).toEqual({ count: 1, polling: false, attempts: [] });
  });
  it('cancels requests on navigation/unmount', async () => {
    const { requests, wrapper } = await setup();
    wrapper.unmount();
    await flushPromises();
    await vi.waitFor(() => expect(requests[0]!.cancelled).toBe(true));
  });
});

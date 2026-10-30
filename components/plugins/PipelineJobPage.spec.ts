import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import PipelineJobPage from './PipelineJobPage.vue';
import { pipelinePage, pipelineJob } from '@/tests/unit/fixtures/pipelinePage';
import { PluginRunStatus } from '@/__generated__/graphql';
const mockUseQuery = vi.hoisted(() => vi.fn());
vi.mock('@vue/apollo-composable', () => ({ useQuery: mockUseQuery }));
let mockCallback: (data: any) => void;
const mockResult = ref<any>();
const mockError = ref<Error | null>(null);
const mockLoading = ref(false);
const mockRefetch = vi.fn(async () => ({}));
beforeEach(() => {
  mockError.value = null;
  mockLoading.value = false;
  mockResult.value = undefined;
  mockRefetch.mockClear();
  mockUseQuery.mockClear();
  mockUseQuery.mockReturnValue({
    result: mockResult,
    error: mockError,
    loading: mockLoading,
    refetch: mockRefetch,
    onResult: (callback: typeof mockCallback) => {
      mockCallback = callback;
    },
  });
});
const initial = () =>
  pipelinePage({ jobsPageInfo: { hasNextPage: true, endCursor: 'jobs-1' } });
describe('PipelineJobPage', () => {
  it('loads stages using the attempt ID and opaque cursor', async () => {
    const wrapper = mount(PipelineJobPage, { props: { attempt: initial() } });
    await wrapper.get('button').trigger('click');
    expect(mockUseQuery.mock.calls[0][1]()).toEqual({
      pipelineRunId: 'attempt-1',
      after: 'jobs-1',
    });
  });
  it('merges stages by ID and keeps the authoritative failure status', () => {
    const page = initial();
    const wrapper = mount(PipelineJobPage, { props: { attempt: page } });
    mockCallback({
      data: {
        getPipelineRunPage: pipelinePage({
          displayStatus: PluginRunStatus.Failed,
          run: {
            ...page.run,
            jobs: [
              pipelineJob(),
              pipelineJob({ id: 'job-2', status: PluginRunStatus.Failed }),
            ],
          },
        }),
      },
    });
    const updated = wrapper.emitted('update')?.[0]?.[0] as ReturnType<
      typeof pipelinePage
    >;
    expect({
      ids: updated.run.jobs.map((job) => job.id),
      status: updated.displayStatus,
    }).toEqual({ ids: ['job-1', 'job-2'], status: 'FAILED' });
  });
  it('shows a recoverable error without replacing existing stages', async () => {
    const wrapper = mount(PipelineJobPage, { props: { attempt: initial() } });
    await wrapper.get('button').trigger('click');
    mockError.value = new Error('offline');
    await wrapper.vm.$nextTick();
    await wrapper.get('button').trigger('click');
    expect({
      error: wrapper.get('[role="alert"]').text(),
      retries: mockRefetch.mock.calls.length,
    }).toEqual({ error: 'Stages could not be loaded. Try again.', retries: 1 });
  });
  it('does not issue another page request while loading', async () => {
    const wrapper = mount(PipelineJobPage, { props: { attempt: initial() } });
    mockLoading.value = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
  });
  it('discards a response for an attempt that was replaced', async () => {
    const page = initial();
    const wrapper = mount(PipelineJobPage, { props: { attempt: page } });
    await wrapper.setProps({
      attempt: pipelinePage({ run: { ...page.run, id: 'other' } }),
    });
    mockCallback({ data: { getPipelineRunPage: page } });
    expect(wrapper.emitted('update')).toBeUndefined();
  });
  it('refreshes active older attempts even without another job page', () => {
    mount(PipelineJobPage, {
      props: { attempt: pipelinePage({ hasActiveWork: true }) },
    });
    expect(mockUseQuery.mock.calls[0][2]()).toMatchObject({
      enabled: true,
      pollInterval: 3000,
    });
  });
});

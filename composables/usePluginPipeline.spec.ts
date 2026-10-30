import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { usePluginPipeline } from './usePluginPipeline';
import { pipelinePage } from '@/tests/unit/fixtures/pipelinePage';
import { PluginRunStatus } from '@/__generated__/graphql';
const mockHistory = vi.hoisted(() => vi.fn());
vi.mock('./usePipelineHistory', () => ({ usePipelineHistory: mockHistory }));
beforeEach(() => {
  mockHistory.mockClear();
  mockHistory.mockReturnValue({
    attempts: ref([pipelinePage()]),
    hasActiveWork: ref(false),
  });
});
describe('usePluginPipeline', () => {
  it.each([
    PluginRunStatus.Failed,
    PluginRunStatus.Running,
    PluginRunStatus.Pending,
    PluginRunStatus.TimedOut,
    PluginRunStatus.Cancelled,
    PluginRunStatus.Skipped,
  ])(
    'uses authoritative %s status even when returned jobs passed',
    (status) => {
      mockHistory.mockReturnValue({
        attempts: ref([
          pipelinePage({
            displayStatus: status,
            hasActiveWork: status === PluginRunStatus.Running,
          }),
        ]),
        hasActiveWork: ref(false),
      });
      const pipeline = usePluginPipeline(
        ref('file-1'),
        ref('DownloadableFile')
      );
      expect(pipeline.latestPipeline.value?.status).toBe(status);
    }
  );
  it('keeps polling activity independent of the visible attempt', () => {
    mockHistory.mockReturnValue({
      attempts: ref([pipelinePage()]),
      hasActiveWork: ref(true),
    });
    expect(
      usePluginPipeline(ref('file-1'), ref('DownloadableFile'))
        .hasActivePipeline.value
    ).toBe(true);
  });
  it('retains queued attempts with no jobs', () => {
    const page = pipelinePage();
    page.run.jobs = [];
    page.hasActiveWork = true;
    page.displayStatus = PluginRunStatus.Pending;
    mockHistory.mockReturnValue({
      attempts: ref([page]),
      hasActiveWork: ref(true),
    });
    expect(
      usePluginPipeline(ref('file-1'), ref('DownloadableFile')).latestPipeline
        .value
    ).toMatchObject({
      pipelineId: 'pipeline-1',
      status: 'PENDING',
      isComplete: false,
      runs: [],
    });
  });
  it('requests the current channel and one latest attempt', () => {
    usePluginPipeline(ref('discussion-1'), ref('Discussion'), {
      channelId: ref('cats'),
    });
    expect(mockHistory.mock.calls[0]![0].value).toEqual({
      targetId: 'discussion-1',
      targetType: 'Discussion',
      channelId: 'cats',
      first: 1,
    });
  });
  it.each([
    [0, ''],
    [500, '500ms'],
    [1500, '1.5s'],
  ])('formats %s ms', (input, output) => {
    expect(
      usePluginPipeline(ref('file-1'), ref('DownloadableFile')).formatDuration(
        Number(input)
      )
    ).toBe(output);
  });
});

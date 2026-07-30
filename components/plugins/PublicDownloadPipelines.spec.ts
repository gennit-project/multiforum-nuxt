import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PublicDownloadPipelines from './PublicDownloadPipelines.vue';
import type * as DownloadPipelineOverviewModule from '@/composables/useDownloadPipelineOverview';

const mockOverview = vi.hoisted(() => ({
  applicablePipelines: [] as unknown[],
  attempts: [] as unknown[],
  hasPipelineContent: false,
  hasActiveAttempt: false,
  isPolling: false,
  loading: false,
  error: null as Error | null,
  refetch: vi.fn(),
}));
const mockUsername = vi.hoisted(() => ({ value: '' }));
const mockModProfileName = vi.hoisted(() => ({ value: '' }));
const mockStartPipeline = vi.hoisted(() => vi.fn());
const mockStartDoneCallbacks = vi.hoisted(
  () => [] as Array<() => void>
);

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  return {
    useMutation: () => ({
      mutate: (...args: unknown[]) => {
        mockStartPipeline(...args);
        mockStartDoneCallbacks.forEach((callback) => callback());
      },
      loading: ref(false),
      error: ref(null),
      onDone: (callback: () => void) => {
        mockStartDoneCallbacks.push(callback);
      },
    }),
  };
});

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => mockUsername,
  useModProfileName: () => mockModProfileName,
}));

vi.mock('@/composables/useDownloadPipelineOverview', async () => {
  const actual = await vi.importActual<
    typeof DownloadPipelineOverviewModule
  >('@/composables/useDownloadPipelineOverview');
  const { ref } = await import('vue');
  return {
    ...actual,
    useDownloadPipelineOverview: () => ({
      applicablePipelines: ref(mockOverview.applicablePipelines),
      attempts: ref(mockOverview.attempts),
      hasPipelineContent: ref(mockOverview.hasPipelineContent),
      hasActiveAttempt: ref(mockOverview.hasActiveAttempt),
      isPolling: ref(mockOverview.isPolling),
      loading: ref(mockOverview.loading),
      error: ref(mockOverview.error),
      refetch: mockOverview.refetch,
    }),
  };
});

const mountView = (ownerUsername = '', uploaderUsername = '') =>
  mount(PublicDownloadPipelines, {
    props: {
      fileId: 'file-1',
      discussionId: 'discussion-1',
      channelName: 'cats',
      ownerUsername,
      uploaderUsername,
    },
  });

const baseAttempt = (overrides: Record<string, unknown> = {}) => ({
  id: 'attempt-1',
  pipelineId: 'pipeline-1',
  targetId: 'file-1',
  targetType: 'DownloadableFile',
  eventType: 'downloadableFile.created',
  scope: 'SERVER',
  status: 'SUCCEEDED',
  trigger: 'EVENT',
  attemptNumber: 1,
  queuedAt: '2026-07-30T00:00:00.000Z',
  createdAt: '2026-07-30T00:00:00.000Z',
  updatedAt: '2026-07-30T00:00:01.000Z',
  jobs: [],
  ...overrides,
});

describe('PublicDownloadPipelines', () => {
  beforeEach(() => {
    mockOverview.applicablePipelines = [];
    mockOverview.attempts = [];
    mockOverview.hasPipelineContent = false;
    mockOverview.hasActiveAttempt = false;
    mockOverview.isPolling = false;
    mockOverview.loading = false;
    mockOverview.error = null;
    mockOverview.refetch.mockReset();
    mockUsername.value = '';
    mockModProfileName.value = '';
    mockStartPipeline.mockReset();
    mockStartDoneCallbacks.length = 0;
  });

  it('shows policy-excluded and not-executed configured checks', () => {
    mockOverview.hasPipelineContent = true;
    mockOverview.applicablePipelines = [
      {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
        eventType: 'downloadableFile.created',
        scope: 'SERVER',
        configured: true,
        applicability: 'NEW_FILES_ONLY',
        required: false,
        reason: 'UPLOADED_BEFORE_POLICY',
        expectedJobs: [
          {
            pluginId: 'scanner',
            pluginName: 'Virus Scanner',
            version: '1.0.0',
            order: 0,
            condition: 'ALWAYS',
            continueOnError: false,
          },
        ],
      },
      {
        targetId: 'discussion-1',
        targetType: 'Discussion',
        eventType: 'discussionChannel.created',
        scope: 'CHANNEL',
        channelId: 'cats',
        configured: true,
        applicability: 'ALL_FILES_IMMEDIATE',
        required: true,
        reason: 'APPLICABLE',
        expectedJobs: [],
      },
    ];

    const text = mountView().text();

    expect({
      notRequired: text.includes('Not required'),
      policyReason: text.includes(
        'uploaded before this check became required'
      ),
      notExecuted: text.includes('Not executed'),
      channel: text.includes('Channel check · cats'),
      expectedJob: text.includes('Virus Scanner'),
    }).toEqual({
      notRequired: true,
      policyReason: true,
      notExecuted: true,
      channel: true,
      expectedJob: true,
    });
  });

  it('renders newest attempt history, all terminal states, and public diagnostics', () => {
    mockOverview.hasPipelineContent = true;
    mockOverview.attempts = [
      baseAttempt({
        id: 'passed',
        attemptNumber: 5,
        jobs: [
          {
            id: 'job-passed',
            pluginId: 'scanner',
            pluginName: 'Virus Scanner',
            version: '2.0.0',
            scope: 'SERVER',
            eventType: 'downloadableFile.created',
            status: 'SUCCEEDED',
            message: 'Plugin completed successfully.',
            durationMs: 1250,
            executionOrder: 0,
            diagnostics: [
              {
                level: 'INFO',
                code: 'SCAN_CLEAN',
                message: 'No threats were found.',
                details: { filesChecked: 3 },
                helpUrl: 'https://example.test/checks/scan-clean',
              },
            ],
            createdAt: '2026-07-30T00:00:00.000Z',
            updatedAt: '2026-07-30T00:00:01.000Z',
          },
        ],
      }),
      baseAttempt({ id: 'failed', status: 'FAILED', attemptNumber: 4 }),
      baseAttempt({ id: 'timeout', status: 'TIMED_OUT', attemptNumber: 3 }),
      baseAttempt({ id: 'cancelled', status: 'CANCELLED', attemptNumber: 2 }),
      baseAttempt({
        id: 'skipped',
        attemptNumber: 1,
        jobs: [
          {
            id: 'job-skipped',
            pluginId: 'scanner',
            pluginName: 'Virus Scanner',
            version: '1.0.0',
            scope: 'SERVER',
            eventType: 'downloadableFile.created',
            status: 'SKIPPED',
            executionOrder: 0,
            diagnostics: [],
            createdAt: '2026-07-30T00:00:00.000Z',
            updatedAt: '2026-07-30T00:00:01.000Z',
          },
        ],
      }),
    ];

    const wrapper = mountView();

    expect({
      statuses: ['Passed', 'Failed', 'Timed out', 'Cancelled', 'Skipped'].every(
        (status) => wrapper.text().includes(status)
      ),
      diagnostic: wrapper.text().includes('SCAN_CLEAN'),
      details: wrapper.text().includes('"filesChecked": 3'),
      documentation: wrapper
        .get('a[target="_blank"]')
        .attributes('href'),
      permalink: wrapper
        .get('[aria-label="Permalink to attempt 5"]')
        .attributes('href'),
    }).toEqual({
      statuses: true,
      diagnostic: true,
      details: true,
      documentation: 'https://example.test/checks/scan-clean',
      permalink:
        '/forums/cats/downloads/discussion-1/pipelines#attempt-passed',
    });
  });

  it('announces polling while work is active', () => {
    mockOverview.hasPipelineContent = true;
    mockOverview.hasActiveAttempt = true;
    mockOverview.isPolling = true;
    mockOverview.attempts = [
      baseAttempt({ status: 'RUNNING', jobs: [] }),
    ];

    expect(mountView().text()).toContain('Updating');
  });

  it('tells a visitor that the uploader must run a missing check', () => {
    mockOverview.hasPipelineContent = true;
    mockOverview.applicablePipelines = [
      {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
        eventType: 'downloadableFile.created',
        scope: 'SERVER',
        configured: true,
        applicability: 'ALL_FILES_IMMEDIATE',
        required: true,
        reason: 'APPLICABLE',
        expectedJobs: [],
      },
    ];

    const wrapper = mountView('discussion-author', 'alice');

    expect({
      explanation: wrapper.text().includes(
        'The uploader must run this check.'
      ),
      hasButton: wrapper.find('button').exists(),
    }).toEqual({ explanation: true, hasButton: false });
  });

  it('lets the uploader start a missing required check', async () => {
    mockUsername.value = 'alice';
    mockOverview.hasPipelineContent = true;
    mockOverview.applicablePipelines = [
      {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
        eventType: 'downloadableFile.created',
        scope: 'SERVER',
        configured: true,
        applicability: 'ALL_FILES_IMMEDIATE',
        required: true,
        reason: 'APPLICABLE',
        expectedJobs: [],
      },
    ];
    const wrapper = mountView('discussion-author', 'alice');

    await wrapper.get('button').trigger('click');

    expect({
      mutation: mockStartPipeline.mock.calls[0]?.[0],
      refetched: mockOverview.refetch.mock.calls.length,
    }).toEqual({
      mutation: {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
        eventType: 'downloadableFile.created',
        channelId: null,
      },
      refetched: 1,
    });
  });

  it('lets a moderator start a missing channel check', async () => {
    mockUsername.value = 'moderator-user';
    mockModProfileName.value = 'Helpful Mod';
    mockOverview.hasPipelineContent = true;
    mockOverview.applicablePipelines = [
      {
        targetId: 'discussion-1',
        targetType: 'Discussion',
        eventType: 'discussionChannel.created',
        scope: 'CHANNEL',
        channelId: 'cats',
        configured: true,
        applicability: 'ALL_FILES_IMMEDIATE',
        required: true,
        reason: 'APPLICABLE',
        expectedJobs: [],
      },
    ];
    const wrapper = mountView('alice');

    await wrapper.get('button').trigger('click');

    expect(mockStartPipeline).toHaveBeenCalledWith({
      targetId: 'discussion-1',
      targetType: 'Discussion',
      eventType: 'discussionChannel.created',
      channelId: 'cats',
    });
  });
});

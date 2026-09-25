import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
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
const mockUserPermissions = vi.hoisted(() => ({
  value: { canEditDiscussions: false },
}));
const mockStartPipeline = vi.hoisted(() => vi.fn());
const mockRerunPipeline = vi.hoisted(() => vi.fn());
const mockStartDoneCallbacks = vi.hoisted(() => [] as Array<() => void>);
const mockRerunDoneCallbacks = vi.hoisted(() => [] as Array<() => void>);
const mockApolloQuery = vi.hoisted(() => vi.fn());
const mockServerAdminUsernames = vi.hoisted(() => ({
  value: [] as string[],
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  return {
    useMutation: (document: { loc?: { source?: { body?: string } } }) => {
      const isRerun = document.loc?.source?.body?.includes(
        'RerunPluginPipeline'
      );
      const mutate = isRerun ? mockRerunPipeline : mockStartPipeline;
      const callbacks = isRerun
        ? mockRerunDoneCallbacks
        : mockStartDoneCallbacks;
      return {
        mutate: (...args: unknown[]) => {
          mutate(...args);
          callbacks.forEach((callback) => callback());
        },
        loading: ref(false),
        error: ref(null),
        onDone: (callback: () => void) => {
          callbacks.push(callback);
        },
      };
    },
    useApolloClient: () => ({ client: { query: mockApolloQuery } }),
  };
});

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => mockUsername,
  useModProfileName: () => mockModProfileName,
}));

vi.mock('@/composables/useCommentPermissions', () => ({
  useChannelPermissions: () => ({
    userPermissions: mockUserPermissions,
    loading: { value: false },
  }),
}));
vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({
    serverAdminUsernames: mockServerAdminUsernames,
  }),
}));

vi.mock('@/composables/useDownloadPipelineOverview', async () => {
  const actual = await vi.importActual<typeof DownloadPipelineOverviewModule>(
    '@/composables/useDownloadPipelineOverview'
  );
  const { ref } = await import('vue');
  return {
    ...actual,
    useSharedDownloadPipelineOverview: () => ({
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
    mockUserPermissions.value.canEditDiscussions = false;
    mockStartPipeline.mockReset();
    mockServerAdminUsernames.value = [];
    mockApolloQuery.mockReset();
    mockRerunPipeline.mockReset();
    mockStartDoneCallbacks.length = 0;
    mockRerunDoneCallbacks.length = 0;
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
      policyReason: text.includes('uploaded before this check became required'),
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
                details: {
                  filesChecked: 3,
                  correlationId: 'scan-correlation-1',
                },
                helpUrl: 'https://example.test/checks/scan-clean',
              },
              {
                level: 'WARNING',
                code: 'PROVIDER_REFERENCE',
                message: 'The provider returned a reference.',
                details: 'Reference ABC',
              },
              {
                level: 'INFO',
                code: 'NO_DETAILS',
                message: 'No additional details were supplied.',
                details: null,
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
      details: wrapper.text().includes('Files Checked'),
      correlationId: wrapper.text().includes('scan-correlation-1'),
      documentation: wrapper.get('a[target="_blank"]').attributes('href'),
      permalink: wrapper
        .get('[aria-label="Permalink to attempt 5"]')
        .attributes('href'),
    }).toEqual({
      statuses: true,
      diagnostic: true,
      details: true,
      correlationId: true,
      documentation: 'https://example.test/checks/scan-clean',
      permalink:
        '/forums/cats/downloads/discussion-1/pipelines?attempt=pipeline-1#attempt-pipeline-1',
    });
  });

  it('announces polling while work is active', () => {
    mockOverview.hasPipelineContent = true;
    mockOverview.hasActiveAttempt = true;
    mockOverview.isPolling = true;
    mockOverview.attempts = [baseAttempt({ status: 'RUNNING', jobs: [] })];

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
      explanation: wrapper
        .text()
        .includes(
          'The uploader or an authorized channel moderator must run this check.'
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

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Run checks'))!
      .trigger('click');

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
    mockUserPermissions.value.canEditDiscussions = true;
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

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Run checks'))!
      .trigger('click');

    expect(mockStartPipeline).toHaveBeenCalledWith({
      targetId: 'discussion-1',
      targetType: 'Discussion',
      eventType: 'discussionChannel.created',
      channelId: 'cats',
    });
  });

  it('does not offer start controls to a moderator without permission', () => {
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

    expect(mountView('alice').text()).not.toContain('Run checks');
  });

  it('lets an authorized moderator rerun the latest failed pipeline', async () => {
    mockUsername.value = 'moderator-user';
    mockModProfileName.value = 'Helpful Mod';
    mockUserPermissions.value.canEditDiscussions = true;
    mockOverview.hasPipelineContent = true;
    mockOverview.attempts = [
      baseAttempt({
        id: 'failed',
        pipelineId: 'failed-pipeline',
        status: 'FAILED',
      }),
    ];
    const wrapper = mountView('alice');

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Run checks again'))!
      .trigger('click');

    expect(mockRerunPipeline).toHaveBeenCalledWith({
      pipelineRunId: 'failed-pipeline',
    });
  });

  it('lets the uploader rerun the latest failed pipeline with current configuration', async () => {
    mockUsername.value = 'alice';
    mockOverview.hasPipelineContent = true;
    mockOverview.attempts = [
      baseAttempt({
        id: 'failed',
        pipelineId: 'failed-pipeline',
        status: 'FAILED',
      }),
    ];
    const wrapper = mountView('discussion-author', 'alice');

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Run checks again'))!
      .trigger('click');

    expect({
      mutation: mockRerunPipeline.mock.calls[0]?.[0],
      explanation: wrapper.text().includes('current configuration'),
      refetched: mockOverview.refetch.mock.calls.length,
    }).toEqual({
      mutation: { pipelineRunId: 'failed-pipeline' },
      explanation: true,
      refetched: 1,
    });
  });

  it('does not offer retry controls to a visitor', () => {
    mockOverview.hasPipelineContent = true;
    mockOverview.attempts = [
      baseAttempt({
        id: 'failed',
        pipelineId: 'failed-pipeline',
        status: 'FAILED',
      }),
    ];

    expect(mountView('alice').text()).not.toContain('Run checks again');
  });

  it('filters failed attempts and copies public diagnostics', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: { writeText },
    });
    mockOverview.hasPipelineContent = true;
    mockOverview.attempts = [
      baseAttempt({ pipelineId: 'passed-pipeline' }),
      baseAttempt({
        id: 'failed',
        pipelineId: 'failed-pipeline',
        attemptNumber: 2,
        status: 'FAILED',
        jobs: [
          {
            id: 'job-1',
            pluginName: 'Security scan',
            status: 'FAILED',
            diagnostics: [
              {
                code: 'SCAN_PROVIDER_ERROR',
                message: 'Provider unavailable',
                details: { retryable: true },
              },
            ],
            executionOrder: 0,
            version: '1.0.0',
          },
        ],
      }),
    ];
    const wrapper = mountView();

    await wrapper
      .get('[data-testid="pipeline-attempt-filter"]')
      .setValue('FAILED');
    expect(wrapper.text()).not.toContain('Attempt 1');
    expect(wrapper.text()).toContain('Attempt 2');

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Copy diagnostics')!
      .trigger('click');
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('SCAN_PROVIDER_ERROR')
    );
    expect(wrapper.text()).toContain('Copied diagnostics for attempt 2');
  });

  it('never offers or requests internal telemetry for a non-admin viewer', () => {
    mockUsername.value = 'alice';
    mockOverview.hasPipelineContent = true;
    mockOverview.attempts = [
      baseAttempt({ status: 'FAILED', pipelineId: 'failed-pipeline' }),
    ];

    const wrapper = mountView('alice', 'alice');

    expect(wrapper.text()).not.toContain('Technical details');
    expect(wrapper.text()).not.toContain('Internal telemetry');
    expect(mockApolloQuery).not.toHaveBeenCalled();
  });

  it('lazily loads and copies internal telemetry for a server admin', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    mockUsername.value = 'admin';
    mockServerAdminUsernames.value = ['admin'];
    mockOverview.hasPipelineContent = true;
    mockOverview.attempts = [
      baseAttempt({ status: 'FAILED', pipelineId: 'failed-pipeline' }),
    ];
    mockApolloQuery.mockResolvedValue({
      data: {
        getInternalPluginPipelineRun: {
          attempt: {
            id: 'attempt-1',
            pipelineId: 'failed-pipeline',
            status: 'FAILED',
            queuedAt: '2026-07-30T00:00:00.000Z',
            startedAt: '2026-07-30T00:00:01.000Z',
            finishedAt: '2026-07-30T00:00:02.000Z',
            updatedAt: '2026-07-30T00:00:02.000Z',
          },
          jobs: [
            {
              id: 'job-1',
              pluginId: 'security-attachment-scan',
              pluginName: 'Security: Attachment Scan',
              version: '0.5.1',
              status: 'FAILED',
              message: 'Scanner request failed.',
              payload: {
                logs: ['Provider returned 503'],
                attachmentUrl: 'https://private.example.test/signed-file',
              },
              executionOrder: 0,
              leaseId: 'lease-1',
              updatedAt: '2026-07-30T00:00:02.000Z',
            },
            {
              id: 'job-2',
              pluginId: 'follow-up',
              pluginName: 'Follow-up check',
              version: '1.0.0',
              status: 'SKIPPED',
              skippedReason: 'Previous stage failed.',
              payload: null,
              executionOrder: 1,
              updatedAt: '2026-07-30T00:00:02.000Z',
            },
          ],
        },
      },
    });
    const wrapper = mountView();

    expect(wrapper.text()).toContain('Technical details');
    expect(wrapper.text()).not.toContain('Provider returned 503');
    expect(mockApolloQuery).not.toHaveBeenCalled();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Technical details')!
      .trigger('click');
    await flushPromises();

    expect(mockApolloQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { pipelineRunId: 'failed-pipeline' },
        fetchPolicy: 'network-only',
      })
    );
    expect(wrapper.text()).toContain('Provider returned 503');
    expect(wrapper.text()).toContain('private attachment URLs');
    expect(wrapper.text()).toContain('Execution lease lease-1');

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Copy internal telemetry')!
      .trigger('click');
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('Provider returned 503')
    );
    expect(wrapper.text()).toContain('Copied internal telemetry for attempt 1');

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Hide technical details')!
      .trigger('click');
    expect(wrapper.text()).not.toContain('Provider returned 503');

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Technical details')!
      .trigger('click');
    expect(wrapper.text()).toContain('Provider returned 503');
    expect(mockApolloQuery).toHaveBeenCalledTimes(1);
  });

  it('shows a recoverable error when internal telemetry cannot be loaded', async () => {
    mockUsername.value = 'admin';
    mockServerAdminUsernames.value = ['admin'];
    mockOverview.hasPipelineContent = true;
    mockOverview.attempts = [
      baseAttempt({ status: 'FAILED', pipelineId: 'failed-pipeline' }),
    ];
    mockApolloQuery
      .mockResolvedValueOnce({
        data: { getInternalPluginPipelineRun: null },
      })
      .mockResolvedValueOnce({
        data: {
          getInternalPluginPipelineRun: {
            attempt: {
              id: 'attempt-1',
              pipelineId: 'failed-pipeline',
              status: 'FAILED',
              updatedAt: '2026-07-30T00:00:02.000Z',
            },
            jobs: [],
          },
        },
      });
    const wrapper = mountView();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Technical details')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Internal telemetry could not be loaded');

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Try again')!
      .trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Pipeline ID: failed-pipeline');
    expect(mockApolloQuery).toHaveBeenCalledTimes(2);
  });
});

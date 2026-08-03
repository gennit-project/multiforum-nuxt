import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DownloadPipelineStatusSummary from './DownloadPipelineStatusSummary.vue';
import type * as DownloadPipelineOverviewModule from '@/composables/useDownloadPipelineOverview';

const mockOverview = vi.hoisted(() => ({
  applicablePipelines: [] as unknown[],
  attempts: [] as unknown[],
  hasPipelineContent: false,
  hasActiveAttempt: false,
  loading: false,
}));

vi.mock('@/composables/useDownloadPipelineOverview', async () => {
  const actual = await vi.importActual<
    typeof DownloadPipelineOverviewModule
  >('@/composables/useDownloadPipelineOverview');
  const { ref } = await import('vue');
  return {
    ...actual,
    useSharedDownloadPipelineOverview: () => ({
      applicablePipelines: ref(mockOverview.applicablePipelines),
      attempts: ref(mockOverview.attempts),
      hasPipelineContent: ref(mockOverview.hasPipelineContent),
      hasActiveAttempt: ref(mockOverview.hasActiveAttempt),
      loading: ref(mockOverview.loading),
    }),
  };
});

const NuxtLinkStub = {
  name: 'NuxtLink',
  props: ['to'],
  template: '<a><slot /></a>',
};

const mountSummary = () =>
  mount(DownloadPipelineStatusSummary, {
    props: {
      fileId: 'file-1',
      discussionId: 'discussion-1',
      channelName: 'cats',
    },
    global: { stubs: { NuxtLink: NuxtLinkStub } },
  });

describe('DownloadPipelineStatusSummary', () => {
  beforeEach(() => {
    mockOverview.applicablePipelines = [];
    mockOverview.attempts = [];
    mockOverview.hasPipelineContent = false;
    mockOverview.hasActiveAttempt = false;
    mockOverview.loading = false;
  });

  it('links compact pipeline status to the public tab', () => {
    mockOverview.hasPipelineContent = true;
    mockOverview.attempts = [{ status: 'SUCCEEDED' }];

    const wrapper = mountSummary();
    const link = wrapper.getComponent(NuxtLinkStub);

    expect({
      text: wrapper.text(),
      route: link.props('to'),
    }).toEqual({
      text: expect.stringContaining('Checks passed'),
      route: {
        name: 'forums-forumId-downloads-discussionId-pipelines',
        params: {
          forumId: 'cats',
          discussionId: 'discussion-1',
        },
      },
    });
  });

  it('renders nothing when no check is applicable and no history exists', () => {
    expect(mountSummary().html()).toBe(
      '<!--v-if-->'
    );
  });

  it('summarizes active, skipped, failed, and not-executed checks', () => {
    mockOverview.hasPipelineContent = true;
    mockOverview.hasActiveAttempt = true;
    const running = mountSummary().text();

    mockOverview.hasActiveAttempt = false;
    mockOverview.attempts = [
      {
        status: 'SUCCEEDED',
        jobs: [{ status: 'SKIPPED' }],
      },
    ];
    const skipped = mountSummary().text();

    mockOverview.attempts = [{ status: 'FAILED', jobs: [] }];
    const failed = mountSummary().text();

    mockOverview.attempts = [];
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
    const missing = mountSummary().text();

    expect({ running, skipped, failed, missing }).toEqual({
      running: expect.stringContaining('Checks running'),
      skipped: expect.stringContaining('Checks skipped'),
      failed: expect.stringContaining('Checks failed'),
      missing: expect.stringContaining('Checks not executed'),
    });
  });
});

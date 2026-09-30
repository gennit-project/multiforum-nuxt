import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createSSRApp, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
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
      loading: ref(mockOverview.loading),
    }),
  };
});

const NuxtLinkStub = {
  name: 'NuxtLink',
  props: ['to'],
  template: '<a><slot /></a>',
};

const mountSummary = async () => {
  const wrapper = mount(DownloadPipelineStatusSummary, {
    props: {
      fileId: 'file-1',
      discussionId: 'discussion-1',
      channelName: 'cats',
    },
    global: { stubs: { NuxtLink: NuxtLinkStub } },
  });
  await nextTick();
  return wrapper;
};

describe('DownloadPipelineStatusSummary', () => {
  beforeEach(() => {
    mockOverview.applicablePipelines = [];
    mockOverview.attempts = [];
    mockOverview.hasPipelineContent = false;
    mockOverview.hasActiveAttempt = false;
    mockOverview.loading = false;
  });

  it('links compact pipeline status to the public tab', async () => {
    mockOverview.hasPipelineContent = true;
    mockOverview.attempts = [{ status: 'SUCCEEDED' }];

    const wrapper = await mountSummary();
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

  it('renders a stable loading shell during SSR', async () => {
    const app = createSSRApp(DownloadPipelineStatusSummary, {
      fileId: 'file-1',
      discussionId: 'discussion-1',
      channelName: 'cats',
    });
    app.component('NuxtLink', NuxtLinkStub);

    expect(await renderToString(app)).toContain('Loading checks…');
  });

  it('renders nothing when no check is applicable and no history exists', async () => {
    expect((await mountSummary()).html()).toBe('<!--v-if-->');
  });

  it('summarizes active, skipped, failed, and not-executed checks', async () => {
    mockOverview.hasPipelineContent = true;
    mockOverview.hasActiveAttempt = true;
    const running = (await mountSummary()).text();

    mockOverview.hasActiveAttempt = false;
    mockOverview.attempts = [
      {
        status: 'SUCCEEDED',
        jobs: [{ status: 'SKIPPED' }],
      },
    ];
    const skipped = (await mountSummary()).text();

    mockOverview.attempts = [{ status: 'FAILED', jobs: [] }];
    const failed = (await mountSummary()).text();

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
    const missing = (await mountSummary()).text();

    expect({ running, skipped, failed, missing }).toEqual({
      running: expect.stringContaining('Checks running'),
      skipped: expect.stringContaining('Checks skipped'),
      failed: expect.stringContaining('Checks failed'),
      missing: expect.stringContaining('Checks not executed'),
    });
  });
});

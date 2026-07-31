import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PluginPipelineCampaigns from './PluginPipelineCampaigns.vue';

const state = vi.hoisted(() => ({
  result: { value: { getPluginPipelineCampaigns: [] as unknown[] } },
  refetch: vi.fn(),
  create: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  query: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: state.result,
    refetch: state.refetch,
  }),
  useMutation: (document: { loc?: { source?: { body?: string } } }) => {
    const body = document.loc?.source?.body || '';
    return {
      mutate: body.includes('PausePluginPipelineCampaign')
        ? state.pause
        : body.includes('ResumePluginPipelineCampaign')
          ? state.resume
          : state.create,
    };
  },
  useApolloClient: () => ({
    resolveClient: () => ({ query: state.query }),
  }),
}));

const policy = {
  policyId: 'policy-1',
  event: 'downloadableFile.created',
  applicability: 'ALL_FILES_GRADUAL' as const,
  effectiveAt: '2026-01-01T00:00:00.000Z',
  steps: [{ plugin: 'scanner' }],
};

beforeEach(() => {
  vi.clearAllMocks();
  state.result.value = { getPluginPipelineCampaigns: [] };
});

describe('PluginPipelineCampaigns', () => {
  it('previews and starts an eligible rollout', async () => {
    state.query.mockResolvedValue({
      data: {
        previewPluginPipelineCampaign: {
          policyId: 'policy-1',
          eventType: 'downloadableFile.created',
          applicability: 'ALL_FILES_GRADUAL',
          enforcementBehavior: 'Existing downloads are checked gradually.',
          affectedFileCount: 1000,
          accessibleFileCount: 990,
          unavailableFileCount: 10,
          estimatedProviderRuns: 990,
        },
      },
    });
    state.create.mockResolvedValue({ data: {} });
    const wrapper = mount(PluginPipelineCampaigns, {
      props: { pipelines: [policy] },
    });

    await wrapper.get('button').trigger('click');
    await Promise.resolve();
    await Promise.resolve();
    expect(wrapper.text()).toContain('1000');
    expect(wrapper.text()).toContain('990');

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Start campaign')!
      .trigger('click');
    expect(state.create).toHaveBeenCalledWith({
      policyId: 'policy-1',
      concurrency: 2,
      rateLimitPerMinute: 30,
    });
  });

  it('pauses running campaigns and links directly to failures', async () => {
    state.result.value = {
      getPluginPipelineCampaigns: [{
        id: 'campaign-1',
        policyId: 'policy-1',
        eventType: 'downloadableFile.created',
        status: 'RUNNING',
        concurrency: 2,
        rateLimitPerMinute: 30,
        completedCount: 5,
        runningCount: 1,
        failedCount: 1,
        timedOutCount: 0,
      }],
    };
    state.pause.mockResolvedValue({ data: {} });
    state.query.mockResolvedValue({
      data: {
        getPluginPipelineCampaignFailures: [{
          pipelineId: 'pipeline-failed',
          targetId: 'file-1',
          discussionId: 'discussion-1',
          channelId: 'cats',
          status: 'FAILED',
          attemptNumber: 2,
        }],
      },
    });
    const wrapper = mount(PluginPipelineCampaigns, {
      props: { pipelines: [policy] },
    });

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Pause')!
      .trigger('click');
    expect(state.pause).toHaveBeenCalledWith({ campaignId: 'campaign-1' });

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'View failures')!
      .trigger('click');
    await Promise.resolve();
    const link = wrapper.get('a');
    expect(link.attributes('href')).toContain(
      '/forums/cats/downloads/discussion-1/pipelines?attempt=pipeline-failed'
    );
  });
});

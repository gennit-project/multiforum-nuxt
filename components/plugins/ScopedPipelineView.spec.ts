import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import ScopedPipelineView from '@/components/plugins/ScopedPipelineView.vue';

const { mockPipelineStates } = vi.hoisted(() => ({
  mockPipelineStates: [] as Array<Record<string, unknown>>,
}));

vi.mock('@/composables/usePluginPipeline', () => ({
  usePluginPipeline: () => {
    const state = mockPipelineStates.shift() ?? {};
    return {
      latestPipeline: ref(null),
      hasActivePipeline: ref(false),
      loading: ref(false),
      error: ref(null),
      isPolling: ref(false),
      getStatusInfo: (status: string) => ({
        icon: `icon-${status.toLowerCase()}`,
        color: `color-${status.toLowerCase()}`,
        label:
          status === 'SUCCEEDED'
            ? 'Passed'
            : status.charAt(0) + status.slice(1).toLowerCase(),
      }),
      ...state,
    };
  },
}));

const run = (overrides: Record<string, unknown> = {}) => ({
  id: 'run-1',
  pipelineId: 'pipeline-1',
  pluginId: 'plugin-1',
  pluginName: 'Spam Filter',
  version: '1.0.0',
  scope: 'SERVER',
  eventType: 'DISCUSSION_CREATED',
  status: 'SUCCEEDED',
  executionOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:01.000Z',
  ...overrides,
});

const pipeline = (overrides: Record<string, unknown> = {}) => ({
  pipelineId: 'pipeline-1',
  runs: [run()],
  startedAt: '2026-01-01T00:00:00.000Z',
  status: 'SUCCEEDED',
  isComplete: true,
  scope: 'SERVER',
  ...overrides,
});

const setPipelineStates = (
  server: Record<string, unknown>,
  channel: Record<string, unknown> = {}
) => {
  mockPipelineStates.length = 0;
  mockPipelineStates.push(server, channel);
};

const mountView = (props: Record<string, unknown> = {}) =>
  mount(ScopedPipelineView, {
    props: {
      fileId: 'file-1',
      discussionId: 'discussion-1',
      channelName: 'support',
      ...props,
    },
    global: {
      stubs: {
        PluginPipelineStage: {
          name: 'PluginPipelineStage',
          props: ['run', 'isLast'],
          emits: ['view-logs'],
          template:
            '<button type="button" class="stage" @click="$emit(\'view-logs\', run)">{{ run.pluginName }}</button>',
        },
        PluginLogsModal: {
          name: 'PluginLogsModal',
          props: ['run', 'visible'],
          emits: ['close'],
          template:
            '<div data-testid="logs-modal" v-if="visible"><button type="button" @click="$emit(\'close\')">close</button>{{ run.pluginName }}</div>',
        },
      },
    },
  });

describe('ScopedPipelineView', () => {
  beforeEach(() => {
    mockPipelineStates.length = 0;
  });

  it('renders nothing when no pipeline is available and nothing is loading', () => {
    setPipelineStates({}, {});

    const wrapper = mountView();

    expect(wrapper.find('.rounded-lg').exists()).toBe(false);
  });

  it('shows the loading state while pipeline data is loading', () => {
    setPipelineStates({ loading: ref(true) }, {});

    const wrapper = mountView();

    expect(wrapper.text()).toContain('Loading pipeline status...');
  });

  it('shows the first pipeline error message', () => {
    setPipelineStates(
      {
        latestPipeline: ref(pipeline()),
        error: ref(new Error('Server pipeline failed to load')),
      },
      { error: ref(new Error('Channel pipeline failed to load')) }
    );

    const wrapper = mountView();

    expect(wrapper.text()).toContain('Server pipeline failed to load');
  });

  it('renders server and channel pipeline sections with status labels', () => {
    setPipelineStates(
      { latestPipeline: ref(pipeline()) },
      {
        latestPipeline: ref(
          pipeline({
            pipelineId: 'pipeline-2',
            scope: 'CHANNEL',
            runs: [run({ id: 'run-2', pluginName: 'Channel Rules' })],
          })
        ),
      }
    );

    const wrapper = mountView();

    expect(wrapper.text()).toContain('Plugin Pipelines');
    expect(wrapper.text()).toContain('Passed');
    expect(wrapper.text()).toContain('Server Pipeline');
    expect(wrapper.text()).toMatch(/Channel Pipeline\s+\(support\)/);
    expect(wrapper.text()).toContain('Spam Filter');
    expect(wrapper.text()).toContain('Channel Rules');
  });

  it('shows running status and polling indicator for active pipelines', () => {
    setPipelineStates(
      {
        latestPipeline: ref(pipeline({ status: 'RUNNING' })),
        hasActivePipeline: ref(true),
        isPolling: ref(true),
      },
      {}
    );

    const wrapper = mountView();

    expect({
      text: wrapper.text(),
      polling: wrapper.get('[title="Auto-refreshing"]').exists(),
    }).toEqual({
      text: expect.stringContaining('Running'),
      polling: true,
    });
  });

  it('collapses and expands pipeline content when collapsible', async () => {
    setPipelineStates({ latestPipeline: ref(pipeline()) }, {});
    const wrapper = mountView({ collapsible: true });

    expect(wrapper.text()).toContain('Server Pipeline');

    await wrapper.get('.cursor-pointer').trigger('click');

    expect(wrapper.text()).not.toContain('Server Pipeline');
  });

  it('opens and closes the logs modal from a stage event', async () => {
    setPipelineStates({ latestPipeline: ref(pipeline()) }, {});
    const wrapper = mountView();

    await wrapper.get('.stage').trigger('click');

    expect(wrapper.get('[data-testid="logs-modal"]').text()).toContain(
      'Spam Filter'
    );

    await wrapper.get('[data-testid="logs-modal"] button').trigger('click');

    expect(wrapper.find('[data-testid="logs-modal"]').exists()).toBe(false);
  });

  it('shows an empty-run message when a pipeline has no runs', () => {
    setPipelineStates({ latestPipeline: ref(pipeline({ runs: [] })) }, {});

    const wrapper = mountView();

    expect(wrapper.text()).toContain('No plugins ran for this content.');
  });
});

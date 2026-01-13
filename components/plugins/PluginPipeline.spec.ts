import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import type { PipelineRun, PipelineGroup } from '@/composables/usePluginPipeline';

// Create mock functions that we can control
const mockRefetch = vi.fn();
let mockLatestPipeline = ref<PipelineGroup | null>(null);
let mockHasActivePipeline = ref(false);
let mockLoading = ref(false);
let mockError = ref<Error | null>(null);
let mockIsPolling = ref(false);

// Mock the composable
vi.mock('@/composables/usePluginPipeline', () => ({
  usePluginPipeline: () => ({
    latestPipeline: mockLatestPipeline,
    hasActivePipeline: mockHasActivePipeline,
    loading: mockLoading,
    error: mockError,
    isPolling: mockIsPolling,
    pipelineGroups: ref([]),
    refetch: mockRefetch,
    formatDuration: (ms?: number) => {
      if (!ms) return '';
      if (ms < 1000) return `${ms}ms`;
      return `${(ms / 1000).toFixed(1)}s`;
    },
    getStatusInfo: (status: string) => {
      const statusMap: Record<string, any> = {
        PENDING: {
          icon: 'fa-solid fa-circle',
          color: 'text-gray-400',
          bgColor: 'bg-gray-100',
          label: 'Pending',
        },
        RUNNING: {
          icon: 'fa-solid fa-spinner fa-spin',
          color: 'text-blue-500',
          bgColor: 'bg-blue-100',
          label: 'Running',
        },
        SUCCEEDED: {
          icon: 'fa-solid fa-check-circle',
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          label: 'Passed',
        },
        FAILED: {
          icon: 'fa-solid fa-times-circle',
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          label: 'Failed',
        },
        SKIPPED: {
          icon: 'fa-solid fa-forward',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          label: 'Skipped',
        },
      };
      return statusMap[status] || statusMap.PENDING;
    },
  }),
}));

describe('PluginPipeline Component', () => {
  const createMockRun = (overrides: Partial<PipelineRun> = {}): PipelineRun => ({
    id: 'run-1',
    pipelineId: 'pipeline-1',
    pluginId: 'test-plugin',
    pluginName: 'Test Plugin',
    version: '1.0.0',
    status: 'SUCCEEDED',
    executionOrder: 0,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:01Z',
    ...overrides,
  });

  const createMockPipelineGroup = (
    overrides: Partial<PipelineGroup> = {}
  ): PipelineGroup => ({
    pipelineId: 'pipeline-1',
    runs: [createMockRun()],
    status: 'SUCCEEDED',
    isComplete: true,
    startedAt: '2024-01-01T10:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    vi.resetModules();
    // Reset all mock refs
    mockLatestPipeline = ref<PipelineGroup | null>(null);
    mockHasActivePipeline = ref(false);
    mockLoading = ref(false);
    mockError = ref<Error | null>(null);
    mockIsPolling = ref(false);
  });

  it('should not render when no pipeline and not loading', async () => {
    const PluginPipeline = await import('./PluginPipeline.vue').then(
      (m) => m.default
    );

    mockLatestPipeline.value = null;
    mockLoading.value = false;

    const wrapper = mount(PluginPipeline, {
      props: {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
      },
    });

    // Component should not render when there's no data and not loading
    expect(wrapper.find('.rounded-lg').exists()).toBe(false);
  });

  it('should show loading state', async () => {
    const PluginPipeline = await import('./PluginPipeline.vue').then(
      (m) => m.default
    );

    mockLoading.value = true;
    mockLatestPipeline.value = null;

    const wrapper = mount(PluginPipeline, {
      props: {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
      },
    });

    expect(wrapper.text()).toContain('Loading pipeline status...');
  });

  it('should display custom title', async () => {
    const PluginPipeline = await import('./PluginPipeline.vue').then(
      (m) => m.default
    );

    mockLatestPipeline.value = createMockPipelineGroup();

    const wrapper = mount(PluginPipeline, {
      props: {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
        title: 'Scan Status',
      },
    });

    expect(wrapper.text()).toContain('Scan Status');
  });

  it('should display default title when none provided', async () => {
    const PluginPipeline = await import('./PluginPipeline.vue').then(
      (m) => m.default
    );

    mockLatestPipeline.value = createMockPipelineGroup();

    const wrapper = mount(PluginPipeline, {
      props: {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
      },
    });

    expect(wrapper.text()).toContain('Plugin Pipeline');
  });

  it('should show error state', async () => {
    const PluginPipeline = await import('./PluginPipeline.vue').then(
      (m) => m.default
    );

    mockLatestPipeline.value = createMockPipelineGroup();
    mockError.value = new Error('Failed to load pipeline');

    const wrapper = mount(PluginPipeline, {
      props: {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
      },
    });

    expect(wrapper.text()).toContain('Failed to load pipeline');
  });

  it('should show running indicator when pipeline is active', async () => {
    const PluginPipeline = await import('./PluginPipeline.vue').then(
      (m) => m.default
    );

    mockLatestPipeline.value = createMockPipelineGroup({
      status: 'RUNNING',
      isComplete: false,
    });
    mockHasActivePipeline.value = true;

    const wrapper = mount(PluginPipeline, {
      props: {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
      },
    });

    expect(wrapper.text()).toContain('Running');
    expect(wrapper.find('.fa-spinner').exists()).toBe(true);
  });

  it('should show status label when pipeline is complete', async () => {
    const PluginPipeline = await import('./PluginPipeline.vue').then(
      (m) => m.default
    );

    mockLatestPipeline.value = createMockPipelineGroup({
      status: 'SUCCEEDED',
      isComplete: true,
    });

    const wrapper = mount(PluginPipeline, {
      props: {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
      },
    });

    expect(wrapper.text()).toContain('Passed');
  });

  it('should show polling indicator when auto-refreshing', async () => {
    const PluginPipeline = await import('./PluginPipeline.vue').then(
      (m) => m.default
    );

    mockLatestPipeline.value = createMockPipelineGroup();
    mockIsPolling.value = true;

    const wrapper = mount(PluginPipeline, {
      props: {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
      },
    });

    expect(wrapper.find('.fa-sync').exists()).toBe(true);
  });

  it('should show collapse button when collapsible is true', async () => {
    const PluginPipeline = await import('./PluginPipeline.vue').then(
      (m) => m.default
    );

    mockLatestPipeline.value = createMockPipelineGroup();

    const wrapper = mount(PluginPipeline, {
      props: {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
        collapsible: true,
      },
    });

    expect(wrapper.find('.fa-chevron-up').exists()).toBe(true);
  });

  it('should toggle expansion when header is clicked and collapsible', async () => {
    const PluginPipeline = await import('./PluginPipeline.vue').then(
      (m) => m.default
    );

    mockLatestPipeline.value = createMockPipelineGroup();

    const wrapper = mount(PluginPipeline, {
      props: {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
        collapsible: true,
      },
    });

    // Initially expanded with chevron-up
    expect(wrapper.find('.fa-chevron-up').exists()).toBe(true);

    // Click header to collapse
    await wrapper.find('.cursor-pointer').trigger('click');

    // Should now show chevron-down
    expect(wrapper.find('.fa-chevron-down').exists()).toBe(true);
  });

  it('should render pipeline stages', async () => {
    const PluginPipeline = await import('./PluginPipeline.vue').then(
      (m) => m.default
    );

    mockLatestPipeline.value = createMockPipelineGroup({
      runs: [
        createMockRun({
          id: 'run-1',
          pluginName: 'Virus Scanner',
          executionOrder: 0,
        }),
        createMockRun({
          id: 'run-2',
          pluginName: 'File Validator',
          executionOrder: 1,
        }),
      ],
    });

    const wrapper = mount(PluginPipeline, {
      props: {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
      },
      global: {
        stubs: {
          PluginPipelineStage: {
            template:
              '<div class="mock-stage">{{ run.pluginName }}</div>',
            props: ['run', 'isLast'],
          },
        },
      },
    });

    const stages = wrapper.findAll('.mock-stage');
    expect(stages.length).toBe(2);
    expect(stages[0].text()).toContain('Virus Scanner');
    expect(stages[1].text()).toContain('File Validator');
  });

  it('should show "No plugins ran" message when runs array is empty', async () => {
    const PluginPipeline = await import('./PluginPipeline.vue').then(
      (m) => m.default
    );

    mockLatestPipeline.value = createMockPipelineGroup({
      runs: [],
    });

    const wrapper = mount(PluginPipeline, {
      props: {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
      },
    });

    expect(wrapper.text()).toContain('No plugins ran for this file');
  });

  it('should not show collapse button when collapsible is false', async () => {
    const PluginPipeline = await import('./PluginPipeline.vue').then(
      (m) => m.default
    );

    mockLatestPipeline.value = createMockPipelineGroup();

    const wrapper = mount(PluginPipeline, {
      props: {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
        collapsible: false,
      },
    });

    // Find buttons and check none have chevron icons
    const buttons = wrapper.findAll('button');
    const hasCollapseButton = buttons.some(
      (btn) =>
        btn.find('.fa-chevron-up').exists() ||
        btn.find('.fa-chevron-down').exists()
    );
    expect(hasCollapseButton).toBe(false);
  });

  it('should display FAILED status correctly', async () => {
    const PluginPipeline = await import('./PluginPipeline.vue').then(
      (m) => m.default
    );

    mockLatestPipeline.value = createMockPipelineGroup({
      status: 'FAILED',
      isComplete: true,
    });

    const wrapper = mount(PluginPipeline, {
      props: {
        targetId: 'file-1',
        targetType: 'DownloadableFile',
      },
    });

    expect(wrapper.text()).toContain('Failed');
  });
});

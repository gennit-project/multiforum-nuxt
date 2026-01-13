import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import type { PipelineRun } from '@/composables/usePluginPipeline';

// Mock the composable
vi.mock('@/composables/usePluginPipeline', () => ({
  usePluginPipeline: () => ({
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

describe('PluginPipelineStage Component', () => {
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

  beforeEach(() => {
    vi.resetModules();
  });

  it('should render plugin name and version', async () => {
    const PluginPipelineStage = await import('./PluginPipelineStage.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({
      pluginName: 'Security Scanner',
      version: '2.0.0',
    });

    const wrapper = mount(PluginPipelineStage, {
      props: {
        run: mockRun,
        isLast: false,
      },
    });

    expect(wrapper.text()).toContain('Security Scanner');
    expect(wrapper.text()).toContain('v2.0.0');
  });

  it('should display status badge with correct label', async () => {
    const PluginPipelineStage = await import('./PluginPipelineStage.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({ status: 'SUCCEEDED' });

    const wrapper = mount(PluginPipelineStage, {
      props: {
        run: mockRun,
        isLast: false,
      },
    });

    expect(wrapper.text()).toContain('Passed');
  });

  it('should show duration for completed runs', async () => {
    const PluginPipelineStage = await import('./PluginPipelineStage.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({
      status: 'SUCCEEDED',
      durationMs: 1500,
    });

    const wrapper = mount(PluginPipelineStage, {
      props: {
        run: mockRun,
        isLast: false,
      },
    });

    expect(wrapper.text()).toContain('1.5s');
  });

  it('should not show duration for PENDING status', async () => {
    const PluginPipelineStage = await import('./PluginPipelineStage.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({
      status: 'PENDING',
      durationMs: 0,
    });

    const wrapper = mount(PluginPipelineStage, {
      props: {
        run: mockRun,
        isLast: false,
      },
    });

    // Should not contain any duration text
    expect(wrapper.text()).not.toMatch(/\d+(\.\d+)?s/);
    expect(wrapper.text()).not.toMatch(/\d+ms/);
  });

  it('should display message when provided', async () => {
    const PluginPipelineStage = await import('./PluginPipelineStage.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({
      status: 'SUCCEEDED',
      message: 'File scanned successfully',
    });

    const wrapper = mount(PluginPipelineStage, {
      props: {
        run: mockRun,
        isLast: false,
      },
    });

    expect(wrapper.text()).toContain('File scanned successfully');
  });

  it('should display skipped reason when status is SKIPPED', async () => {
    const PluginPipelineStage = await import('./PluginPipelineStage.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({
      status: 'SKIPPED',
      skippedReason: 'Previous step failed',
    });

    const wrapper = mount(PluginPipelineStage, {
      props: {
        run: mockRun,
        isLast: false,
      },
    });

    expect(wrapper.text()).toContain('Skipped: Previous step failed');
  });

  it('should show "View Details" button for completed runs with details', async () => {
    const PluginPipelineStage = await import('./PluginPipelineStage.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({
      status: 'SUCCEEDED',
      message: 'Scan complete',
    });

    const wrapper = mount(PluginPipelineStage, {
      props: {
        run: mockRun,
        isLast: false,
      },
    });

    const viewDetailsButton = wrapper.find('button');
    expect(viewDetailsButton.exists()).toBe(true);
    expect(viewDetailsButton.text()).toContain('View Details');
  });

  it('should emit viewLogs event when "View Details" is clicked', async () => {
    const PluginPipelineStage = await import('./PluginPipelineStage.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({
      status: 'SUCCEEDED',
      message: 'Scan complete',
    });

    const wrapper = mount(PluginPipelineStage, {
      props: {
        run: mockRun,
        isLast: false,
      },
    });

    const viewDetailsButton = wrapper.find('button');
    await viewDetailsButton.trigger('click');

    expect(wrapper.emitted()).toHaveProperty('viewLogs');
    expect(wrapper.emitted('viewLogs')?.[0]).toEqual([mockRun]);
  });

  it('should not show "View Details" for PENDING or RUNNING runs', async () => {
    const PluginPipelineStage = await import('./PluginPipelineStage.vue').then(
      (m) => m.default
    );

    const pendingRun = createMockRun({
      status: 'PENDING',
      message: 'Waiting...',
    });

    const wrapper = mount(PluginPipelineStage, {
      props: {
        run: pendingRun,
        isLast: false,
      },
    });

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('should show connector line when not the last item', async () => {
    const PluginPipelineStage = await import('./PluginPipelineStage.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun();

    const wrapper = mount(PluginPipelineStage, {
      props: {
        run: mockRun,
        isLast: false,
      },
    });

    // Check for connector line element
    const connectorLine = wrapper.find('.absolute.left-3');
    expect(connectorLine.exists()).toBe(true);
  });

  it('should not show connector line when it is the last item', async () => {
    const PluginPipelineStage = await import('./PluginPipelineStage.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun();

    const wrapper = mount(PluginPipelineStage, {
      props: {
        run: mockRun,
        isLast: true,
      },
    });

    // Connector line should not exist
    const connectorLine = wrapper.find('.absolute.left-3');
    expect(connectorLine.exists()).toBe(false);
  });

  it('should use pluginId as fallback when pluginName is not provided', async () => {
    const PluginPipelineStage = await import('./PluginPipelineStage.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({
      pluginName: '',
      pluginId: 'my-custom-plugin',
    });

    const wrapper = mount(PluginPipelineStage, {
      props: {
        run: mockRun,
        isLast: false,
      },
    });

    expect(wrapper.text()).toContain('my-custom-plugin');
  });
});

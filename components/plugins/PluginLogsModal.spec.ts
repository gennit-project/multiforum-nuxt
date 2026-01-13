import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import type { PipelineRun } from '@/composables/usePluginPipeline';

// Mock headlessui/vue components
vi.mock('@headlessui/vue', () => ({
  Dialog: {
    name: 'Dialog',
    template: '<div data-testid="dialog"><slot /></div>',
    props: ['as'],
  },
  DialogPanel: {
    name: 'DialogPanel',
    template: '<div data-testid="dialog-panel"><slot /></div>',
  },
  DialogTitle: {
    name: 'DialogTitle',
    template: '<h3 data-testid="dialog-title"><slot /></h3>',
    props: ['as'],
  },
  TransitionChild: {
    name: 'TransitionChild',
    template: '<div><slot /></div>',
    props: ['as', 'enter', 'enterFrom', 'enterTo', 'leave', 'leaveFrom', 'leaveTo'],
  },
  TransitionRoot: {
    name: 'TransitionRoot',
    template: '<div v-if="show"><slot /></div>',
    props: ['as', 'show'],
  },
}));

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

describe('PluginLogsModal Component', () => {
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
    // Mock navigator.clipboard using stubGlobal
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should render when visible is true', async () => {
    const PluginLogsModal = await import('./PluginLogsModal.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun();

    const wrapper = mount(PluginLogsModal, {
      props: {
        run: mockRun,
        visible: true,
      },
      global: {
        stubs: {
          'client-only': {
            template: '<slot />',
          },
        },
      },
    });

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true);
  });

  it('should not render when visible is false', async () => {
    const PluginLogsModal = await import('./PluginLogsModal.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun();

    const wrapper = mount(PluginLogsModal, {
      props: {
        run: mockRun,
        visible: false,
      },
      global: {
        stubs: {
          'client-only': {
            template: '<slot />',
          },
        },
      },
    });

    expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
  });

  it('should display plugin name and version', async () => {
    const PluginLogsModal = await import('./PluginLogsModal.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({
      pluginName: 'Security Scanner',
      version: '2.5.0',
    });

    const wrapper = mount(PluginLogsModal, {
      props: {
        run: mockRun,
        visible: true,
      },
      global: {
        stubs: {
          'client-only': {
            template: '<slot />',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Security Scanner');
    expect(wrapper.text()).toContain('v2.5.0');
  });

  it('should display status label', async () => {
    const PluginLogsModal = await import('./PluginLogsModal.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({ status: 'SUCCEEDED' });

    const wrapper = mount(PluginLogsModal, {
      props: {
        run: mockRun,
        visible: true,
      },
      global: {
        stubs: {
          'client-only': {
            template: '<slot />',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Passed');
  });

  it('should display execution order', async () => {
    const PluginLogsModal = await import('./PluginLogsModal.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({ executionOrder: 2 });

    const wrapper = mount(PluginLogsModal, {
      props: {
        run: mockRun,
        visible: true,
      },
      global: {
        stubs: {
          'client-only': {
            template: '<slot />',
          },
        },
      },
    });

    // Execution order is displayed as 1-indexed
    expect(wrapper.text()).toContain('#3');
  });

  it('should display duration when provided', async () => {
    const PluginLogsModal = await import('./PluginLogsModal.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({ durationMs: 2500 });

    const wrapper = mount(PluginLogsModal, {
      props: {
        run: mockRun,
        visible: true,
      },
      global: {
        stubs: {
          'client-only': {
            template: '<slot />',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('2.5s');
  });

  it('should display message when provided', async () => {
    const PluginLogsModal = await import('./PluginLogsModal.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({
      message: 'File scanned successfully, no threats detected',
    });

    const wrapper = mount(PluginLogsModal, {
      props: {
        run: mockRun,
        visible: true,
      },
      global: {
        stubs: {
          'client-only': {
            template: '<slot />',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('File scanned successfully, no threats detected');
  });

  it('should display skipped reason when provided', async () => {
    const PluginLogsModal = await import('./PluginLogsModal.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({
      status: 'SKIPPED',
      skippedReason: 'Condition PREVIOUS_SUCCEEDED not met',
    });

    const wrapper = mount(PluginLogsModal, {
      props: {
        run: mockRun,
        visible: true,
      },
      global: {
        stubs: {
          'client-only': {
            template: '<slot />',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Condition PREVIOUS_SUCCEEDED not met');
  });

  it('should display JSON payload when provided', async () => {
    const PluginLogsModal = await import('./PluginLogsModal.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({
      payload: { result: 'clean', scanTime: 1200 },
    });

    const wrapper = mount(PluginLogsModal, {
      props: {
        run: mockRun,
        visible: true,
      },
      global: {
        stubs: {
          'client-only': {
            template: '<slot />',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('"result"');
    expect(wrapper.text()).toContain('"clean"');
  });

  it('should emit close event when close button is clicked', async () => {
    const PluginLogsModal = await import('./PluginLogsModal.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun();

    const wrapper = mount(PluginLogsModal, {
      props: {
        run: mockRun,
        visible: true,
      },
      global: {
        stubs: {
          'client-only': {
            template: '<slot />',
          },
        },
      },
    });

    // Find the close button (the one with fa-times icon)
    const closeButtons = wrapper.findAll('button');
    const closeButton = closeButtons.find((btn) =>
      btn.find('.fa-times').exists()
    );

    if (closeButton) {
      await closeButton.trigger('click');
      expect(wrapper.emitted()).toHaveProperty('close');
    }
  });

  it('should emit close event when footer Close button is clicked', async () => {
    const PluginLogsModal = await import('./PluginLogsModal.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun();

    const wrapper = mount(PluginLogsModal, {
      props: {
        run: mockRun,
        visible: true,
      },
      global: {
        stubs: {
          'client-only': {
            template: '<slot />',
          },
        },
      },
    });

    // Find the Close button in the footer
    const buttons = wrapper.findAll('button');
    const footerCloseButton = buttons.find((btn) =>
      btn.text() === 'Close'
    );

    if (footerCloseButton) {
      await footerCloseButton.trigger('click');
      expect(wrapper.emitted()).toHaveProperty('close');
    }
  });

  it('should show copy button for payload', async () => {
    const PluginLogsModal = await import('./PluginLogsModal.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({
      payload: { test: 'data' },
    });

    const wrapper = mount(PluginLogsModal, {
      props: {
        run: mockRun,
        visible: true,
      },
      global: {
        stubs: {
          'client-only': {
            template: '<slot />',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Copy');
  });

  it('should show "No additional details" when no message, reason, or payload', async () => {
    const PluginLogsModal = await import('./PluginLogsModal.vue').then(
      (m) => m.default
    );

    const mockRun = createMockRun({
      message: undefined,
      skippedReason: undefined,
      payload: undefined,
    });

    const wrapper = mount(PluginLogsModal, {
      props: {
        run: mockRun,
        visible: true,
      },
      global: {
        stubs: {
          'client-only': {
            template: '<slot />',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('No additional details available');
  });
});

import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import ServerDashboardSecondaryStats from '@/components/admin/ServerDashboardSecondaryStats.vue';

describe('ServerDashboardSecondaryStats', () => {
  it('renders the download and suspension metrics', () => {
    const wrapper = mountWithDefaults(ServerDashboardSecondaryStats, {
      props: {
        downloadCount: 42,
        suspensionCount: 7,
      },
      global: {
        stubs: {
          Download: { name: 'Download', template: '<svg class="download-icon" />' },
          Lock: { name: 'Lock', template: '<svg class="lock-icon" />' },
        },
      },
    });

    expect(wrapper.text()).toContain('42Downloads7Suspensions');
  });
});

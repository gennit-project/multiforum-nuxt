import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import ServerDashboardPipelineHealth from '@/components/admin/ServerDashboardPipelineHealth.vue';

const healthySummary = {
  failedDownloadScanCount: 0,
  queuedPluginJobCount: 0,
  runningPluginJobCount: 0,
  oldestQueuedPluginJobAgeSeconds: 0,
  pluginTimeoutCount24h: 0,
  pluginTimeoutRate24h: 0,
  repeatedPluginFailureCount24h: 0,
  pluginRetryAttemptCount1h: 0,
  pluginRetryStormCount1h: 0,
};

const reportedSummary = {
  failedDownloadScanCount: 2,
  queuedPluginJobCount: 3,
  runningPluginJobCount: 1,
  oldestQueuedPluginJobAgeSeconds: 45,
  pluginTimeoutCount24h: 4,
  pluginTimeoutRate24h: 0.125,
  repeatedPluginFailureCount24h: 2,
  pluginRetryAttemptCount1h: 9,
  pluginRetryStormCount1h: 1,
};

const mountPipeline = (summary: Record<string, unknown>) =>
  mountWithDefaults(ServerDashboardPipelineHealth, {
    props: { summary },
    global: {
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  });

const rowText = (wrapper: ReturnType<typeof mountPipeline>, key: string) =>
  wrapper.get(`[data-testid="pipeline-row-${key}"]`).text();

describe('ServerDashboardPipelineHealth', () => {
  it.each([
    ['scan-failures', /Scan failures\s*Downloads blocked by scanner errors\s*2$/],
    ['job-queue', /Job queue\s*3 queued · 1 running\s*4$/],
    ['timeouts', /Timeouts, 24h\s*12\.5% rate · 2 repeated failures\s*4$/],
    ['retry-storms', /Retry storms, 1h\s*9 retries in the last hour\s*1$/],
  ])('renders the %s metric when the backend reports it', (key, expected) => {
    expect(rowText(mountPipeline(reportedSummary), key)).toMatch(expected);
  });

  it('never renders NaN or undefined when pipeline fields are missing', () => {
    const wrapper = mountPipeline({ failedDownloadScanCount: 2 });

    expect(wrapper.text()).not.toMatch(/NaN|undefined/);
  });

  it('shows "No data" for each metric that is missing', () => {
    const wrapper = mountPipeline({ failedDownloadScanCount: 2 });

    expect(
      wrapper
        .findAll('[data-testid^="pipeline-row-"]')
        .filter((row) => row.text().endsWith('No data')).length
    ).toBe(3);
  });

  it('treats null fields as missing', () => {
    const wrapper = mountPipeline({
      ...healthySummary,
      pluginTimeoutCount24h: null,
    });

    expect(rowText(wrapper, 'timeouts')).toMatch(/No data$/);
  });

  it('hides the not-reporting note when every metric is present', () => {
    const wrapper = mountPipeline(healthySummary);

    expect(wrapper.find('[data-testid="pipeline-no-data-note"]').exists()).toBe(
      false
    );
  });

  it('links the not-reporting note to the plugins page', () => {
    const wrapper = mountPipeline({});

    expect(
      wrapper.get('[data-testid="pipeline-no-data-note"] a').attributes('href')
    ).toBe('/admin/plugins');
  });
});

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ServerDashboardMetricCards from '@/components/admin/ServerDashboardMetricCards.vue';

const mountCards = (summary: Record<string, unknown> = {}) =>
  mount(ServerDashboardMetricCards, {
    props: {
      summary: {
        activeChannelCount: 12,
        discussionCount: 1000,
        commentCount: 2500,
        eventCount: 500,
        voteCount: 4500,
        openIssueCount: 3,
        issueOpenedCount: 7,
        issueClosedCount: 4,
        moderationActionCount: 11,
        archivedContentCount: 2,
        lockedContentCount: 1,
        failedDownloadScanCount: 2,
        queuedPluginJobCount: 0,
        runningPluginJobCount: 0,
        pluginTimeoutCount24h: 0,
        pluginTimeoutRate24h: 0,
        repeatedPluginFailureCount24h: 0,
        pluginRetryAttemptCount1h: 0,
        pluginRetryStormCount1h: 0,
        oldestQueuedPluginJobAgeSeconds: 0,
        medianOpenIssueAgeDays: 8.4,
        ...summary,
      },
    },
    global: {
      stubs: {
        Users: { template: '<svg class="users" />' },
        Flag: { template: '<svg class="flag" />' },
        Clock3: { template: '<svg class="clock" />' },
        ShieldAlert: { template: '<svg class="shield" />' },
        ShieldX: { template: '<svg class="shield-x" />' },
        Hourglass: { template: '<svg class="hourglass" />' },
        RotateCcw: { template: '<svg class="retry" />' },
        ThumbsUp: { template: '<svg class="thumbs" />' },
        Archive: { template: '<svg class="archive" />' },
      },
    },
  });

describe('ServerDashboardMetricCards', () => {
  it('shows derived contribution totals and formatted large numbers', () => {
    const wrapper = mountCards();

    expect(wrapper.text()).toContain('4000 contributions');
    expect(wrapper.text()).toContain('4,500');
    expect(wrapper.text()).toContain('2500 comments');
  });

  it('uses warning tones when open issues, old issue age, and archived content are present', () => {
    const wrapper = mountCards();

    expect({
      yellowCount: wrapper.findAll('.text-yellow-600').length,
      hasAgeLabel: wrapper.text().includes('8d'),
      hasArchivedDetail: wrapper.text().includes('1 locked'),
    }).toEqual({
      yellowCount: 3,
      hasAgeLabel: true,
      hasArchivedDetail: true,
    });
  });

  it('uses green and slate fallback tones when counts are clear or absent', () => {
    const wrapper = mountCards({
      openIssueCount: 0,
      archivedContentCount: 0,
      medianOpenIssueAgeDays: null,
      failedDownloadScanCount: 0,
    });

    expect({
      greenCount: wrapper.findAll('.text-green-600').length,
      yellowCount: wrapper.findAll('.text-yellow-600').length,
      zeroAge: wrapper.text().includes('0d'),
    }).toEqual({
      greenCount: 6,
      yellowCount: 0,
      zeroAge: true,
    });
  });

  it('highlights failed security scans as an operational alert', () => {
    const wrapper = mountCards({ failedDownloadScanCount: 2 });

    expect({
      hasLabel: wrapper.text().includes('Scan Failures'),
      hasDetail: wrapper.text().includes('downloads blocked by scanner errors'),
      redCount: wrapper.findAll('.text-red-600').length,
    }).toEqual({ hasLabel: true, hasDetail: true, redCount: 1 });
  });

  it('surfaces pipeline queue, timeout, repeated failure, and retry metrics', () => {
    const wrapper = mountCards({
      queuedPluginJobCount: 2,
      runningPluginJobCount: 1,
      pluginTimeoutCount24h: 3,
      pluginTimeoutRate24h: 0.125,
      repeatedPluginFailureCount24h: 2,
      pluginRetryAttemptCount1h: 4,
      pluginRetryStormCount1h: 1,
      oldestQueuedPluginJobAgeSeconds: 45,
    });

    expect({
      timeouts: wrapper.text().includes('Pipeline Timeouts'),
      timeoutRate: wrapper.text().includes('12.5% rate · 2 repeated failures'),
      queue: wrapper.text().includes('2 queued · 1 running · 45s oldest'),
      retries: wrapper.text().includes('4 retries in the last hour'),
    }).toEqual({
      timeouts: true,
      timeoutRate: true,
      queue: true,
      retries: true,
    });
  });
});

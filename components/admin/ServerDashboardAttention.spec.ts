import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ServerDashboardAttention from './ServerDashboardAttention.vue';

const mockQueue = vi.hoisted(() => ({ items: [] as unknown[] }));

const reviewItem = {
  downloadableFileId: 'file-1',
  fileName: 'asset.zip',
  scanStatus: 'SUSPICIOUS',
  scanReason: 'Archive contains an installer',
  reviewRequestedAt: '2026-07-19T00:00:00Z',
  reviewRequestReason: 'This is source code only',
  uploaderUsername: 'alice',
  discussionId: 'discussion-1',
  discussionTitle: 'Asset pack',
  channelUniqueName: 'general',
};

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    result: ref({ getDownloadScanReviewQueue: mockQueue.items }),
    loading: ref(false),
    error: ref(null),
  })),
}));

const mountAttention = (props: Record<string, unknown> = {}) =>
  mount(ServerDashboardAttention, {
    props: { openIssueCount: 0, ...props },
    global: {
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  });

beforeEach(() => {
  mockQueue.items = [reviewItem];
});

describe('ServerDashboardAttention', () => {
  it('summarises each quarantined file with its status and scanner reason', () => {
    const wrapper = mountAttention();

    expect(wrapper.get('[data-testid="scan-review-item"]').text()).toMatch(
      /asset\.zip\s*Suspicious\s*Review requested\s*Asset pack\s*· alice · Archive contains an installer/
    );
  });

  it('links each file to its download page instead of acting on it in place', () => {
    const wrapper = mountAttention();

    expect(wrapper.get('[data-testid="review-link"]').attributes('href')).toBe(
      '/forums/general/downloads/discussion-1'
    );
  });

  it('names the file in the review link for assistive technology', () => {
    const wrapper = mountAttention();

    expect(
      wrapper.get('[data-testid="review-link"]').attributes('aria-label')
    ).toBe('Review asset.zip');
  });

  it('offers no in-place scan actions', () => {
    const wrapper = mountAttention();

    expect(wrapper.findAll('button')).toHaveLength(0);
  });

  it('renders no review link when the file has no channel to link into', () => {
    mockQueue.items = [{ ...reviewItem, channelUniqueName: null }];
    const wrapper = mountAttention();

    expect(wrapper.find('[data-testid="review-link"]').exists()).toBe(false);
  });

  it('shows the open admin issues row with the oldest issue and its channel', () => {
    const wrapper = mountAttention({
      openIssueCount: 2,
      oldestOpenIssueAgeDays: 286,
      oldestOpenIssueChannel: 'toDelete',
    });

    expect(wrapper.get('[data-testid="attention-open-issues"]').text()).toMatch(
      /^2 admin issues are still open\s*Oldest is 286 days old, in toDelete\.\s*Open issues$/
    );
  });

  it('omits the open issues row when no admin issues are open', () => {
    const wrapper = mountAttention({ openIssueCount: 0 });

    expect(wrapper.find('[data-testid="attention-open-issues"]').exists()).toBe(
      false
    );
  });

  it('counts quarantined files and open issues in the header badge', () => {
    const wrapper = mountAttention({ openIssueCount: 2 });

    expect(wrapper.get('[data-testid="attention-count"]').text()).toBe(
      '2 items'
    );
  });

  it('says nothing needs attention when there is no work', () => {
    mockQueue.items = [];
    const wrapper = mountAttention();

    expect(wrapper.get('[data-testid="attention-empty"]').text()).toBe(
      'Nothing needs your attention right now.'
    );
  });
});

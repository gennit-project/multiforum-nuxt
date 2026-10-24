import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import ServerDashboardAttention from './ServerDashboardAttention.vue';

const mockClear = vi.hoisted(() => vi.fn());
const mockRetry = vi.hoisted(() => vi.fn());
const mockRefetch = vi.hoisted(() => vi.fn(() => Promise.resolve()));
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
    refetch: mockRefetch,
  })),
  useMutation: vi.fn((document) => {
    const doneHandlers: Array<() => void> = [];
    const target =
      document.definitions?.[0]?.name?.value === 'retryDownloadableFileScan'
        ? mockRetry
        : mockClear;
    return {
      // Mirror Apollo: the mutation resolves, then onDone handlers run.
      mutate: vi.fn((variables) => {
        target(variables);
        doneHandlers.forEach((handler) => handler());
        return Promise.resolve();
      }),
      loading: ref(false),
      error: ref(null),
      onDone: (handler: () => void) => {
        doneHandlers.push(handler);
      },
    };
  }),
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

const buttonByText = (
  wrapper: ReturnType<typeof mountAttention>,
  text: string
) => wrapper.findAll('button').find((button) => button.text() === text);

beforeEach(() => {
  vi.clearAllMocks();
  mockQueue.items = [reviewItem];
});

describe('ServerDashboardAttention', () => {
  it('summarises each quarantined file with its status and scanner reason', () => {
    const wrapper = mountAttention();

    expect(wrapper.get('[data-testid="scan-review-item"]').text()).toMatch(
      /asset\.zip\s*Suspicious\s*Asset pack\s*· alice · Archive contains an installer/
    );
  });

  it('keeps the release form collapsed until Review is pressed', () => {
    const wrapper = mountAttention();

    expect(wrapper.find('[data-testid="release-quarantine"]').exists()).toBe(
      false
    );
  });

  it('expands the release form when Review is pressed', async () => {
    const wrapper = mountAttention();
    await wrapper.get('[data-testid="review-toggle"]').trigger('click');

    expect(
      wrapper.get('[data-testid="review-toggle"]').attributes('aria-expanded')
    ).toBe('true');
  });

  it('renders the creator review request once expanded', async () => {
    const wrapper = mountAttention();
    await wrapper.get('[data-testid="review-toggle"]').trigger('click');

    expect(wrapper.text()).toContain(
      'Creator requested human review: This is source code only'
    );
  });

  it('keeps quarantine release disabled until an audit reason is entered', async () => {
    const wrapper = mountAttention();
    await wrapper.get('[data-testid="review-toggle"]').trigger('click');

    expect(
      wrapper.get('[data-testid="release-quarantine"]').attributes('disabled')
    ).toBe('');
  });

  it('labels the reason input for assistive technology', async () => {
    const wrapper = mountAttention();
    await wrapper.get('[data-testid="review-toggle"]').trigger('click');
    const inputId = wrapper.get('input').attributes('id');

    expect(wrapper.get(`label[for="${inputId}"]`).text()).toBe(
      'Required release reason'
    );
  });

  it('clears a reviewed file with its reason', async () => {
    const wrapper = mountAttention();
    await wrapper.get('[data-testid="review-toggle"]').trigger('click');
    await wrapper.get('input').setValue('Reviewed archive contents');
    await wrapper.get('[data-testid="release-quarantine"]').trigger('click');
    await flushPromises();

    expect(mockClear).toHaveBeenCalledWith({
      downloadableFileId: 'file-1',
      reason: 'Reviewed archive contents',
    });
  });

  it('refreshes the queue after releasing a file', async () => {
    const wrapper = mountAttention();
    await wrapper.get('[data-testid="review-toggle"]').trigger('click');
    await wrapper.get('input').setValue('Reviewed archive contents');
    await wrapper.get('[data-testid="release-quarantine"]').trigger('click');
    await flushPromises();

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('collapses the release form after releasing a file', async () => {
    const wrapper = mountAttention();
    await wrapper.get('[data-testid="review-toggle"]').trigger('click');
    await wrapper.get('input').setValue('Reviewed archive contents');
    await wrapper.get('[data-testid="release-quarantine"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="release-quarantine"]').exists()).toBe(
      false
    );
  });

  it('retries a scan without expanding the review form', async () => {
    const wrapper = mountAttention();
    await buttonByText(wrapper, 'Retry scan')?.trigger('click');
    await flushPromises();

    expect(mockRetry).toHaveBeenCalledWith({ downloadableFileId: 'file-1' });
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

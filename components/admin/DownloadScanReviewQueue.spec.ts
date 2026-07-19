import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';
import DownloadScanReviewQueue from './DownloadScanReviewQueue.vue';

const mockClear = vi.hoisted(() => vi.fn(() => Promise.resolve()));
const mockRefetch = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    result: ref({
      getDownloadScanReviewQueue: [{
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
      }],
    }),
    loading: ref(false),
    error: ref(null),
    refetch: mockRefetch,
  })),
  useMutation: vi.fn(() => ({
    mutate: mockClear,
    loading: ref(false),
    error: ref(null),
  })),
}));

const mountQueue = () => mount(DownloadScanReviewQueue, {
  global: {
    stubs: {
      NuxtLink: {
        props: ['to'],
        template: '<a :href="to"><slot /></a>',
      },
    },
  },
});

describe('DownloadScanReviewQueue', () => {
  it('renders scanner context and the creator review request', () => {
    const wrapper = mountQueue();

    expect(wrapper.text()).toContain(
      'Creator requested human review: This is source code only'
    );
  });

  it('clears a reviewed file and refreshes the queue', async () => {
    const wrapper = mountQueue();
    await wrapper.get('input').setValue('Reviewed archive contents');
    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect({
      mutation: mockClear.mock.calls.at(-1)?.[0],
      refetched: mockRefetch.mock.calls.length > 0,
    }).toEqual({
      mutation: {
        downloadableFileId: 'file-1',
        reason: 'Reviewed archive contents',
      },
      refetched: true,
    });
  });
});

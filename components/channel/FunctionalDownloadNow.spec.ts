import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import FunctionalDownloadNow from '@/components/channel/FunctionalDownloadNow.vue';

const h = vi.hoisted(() => ({
  trackDownload: vi.fn(() => Promise.resolve()),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: h.trackDownload,
  }),
}));

vi.mock('@/graphQLData/discussion/mutations', () => ({
  TRACK_DOWNLOAD: 'TRACK_DOWNLOAD',
}));

const mountButton = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(FunctionalDownloadNow, {
    props: {
      url: 'https://example.com/file.zip',
      fileName: 'file.zip',
      downloadableFileId: 'file-1',
      discussionId: 'discussion-1',
      ...props,
    },
    global: {
      stubs: {
        DownloadNowButton: {
          name: 'DownloadNowButton',
          props: ['disabled'],
          emits: ['click'],
          template:
            '<button class="download-now-button" :disabled="disabled" @click="$emit(\'click\')" />',
        },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('FunctionalDownloadNow', () => {
  it('tracks the download and emits downloaded after a successful click', async () => {
    const anchor = document.createElement('a');
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) =>
        tagName === 'a'
          ? anchor
          : originalCreateElement(tagName)
      );
    const wrapper = mountButton();

    await wrapper.get('.download-now-button').trigger('click');
    await vi.runAllTimersAsync();

    expect({
      tracked: h.trackDownload.mock.calls,
      emitted: wrapper.emitted('downloaded'),
    }).toEqual({
      tracked: [[{ downloadableFileId: 'file-1', discussionId: 'discussion-1' }]],
      emitted: [[]],
    });

    createElementSpy.mockRestore();
  });

  it('logs an error and skips tracking when there is no download url', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mountButton({ url: '' });

    await wrapper.get('.download-now-button').trigger('click');

    expect({
      error: errorSpy.mock.calls[0]?.[0],
      tracked: h.trackDownload.mock.calls.length,
      emitted: wrapper.emitted('downloaded'),
    }).toEqual({
      error: 'No download URL available',
      tracked: 0,
      emitted: undefined,
    });
  });
});

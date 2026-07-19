import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import FunctionalDownloadNow from '@/components/channel/FunctionalDownloadNow.vue';

const mockPrepareDownload = vi.fn();
const mockLoading = ref(false);
const mockError = ref<Error | null>(null);
const mockShowToast = vi.fn(() => 'toast-1');
const mockUpdateToast = vi.fn();

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mockPrepareDownload,
    loading: mockLoading,
    error: mockError,
  }),
}));

vi.mock('@/stores/toastStore', () => ({
  useToastStore: () => ({
    showToast: mockShowToast,
    updateToast: mockUpdateToast,
  }),
}));

vi.mock('@/graphQLData/discussion/mutations', () => ({
  PREPARE_DOWNLOAD: 'PREPARE_DOWNLOAD',
}));

const mountButton = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(FunctionalDownloadNow, {
    props: {
      fileName: 'file.zip',
      downloadableFileId: 'file-1',
      discussionId: 'discussion-1',
      ...props,
    },
    global: {
      stubs: {
        DownloadNowButton: {
          name: 'DownloadNowButton',
          props: ['disabled', 'label'],
          emits: ['click'],
          template:
            '<button class="download-now-button" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
        },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockLoading.value = false;
  mockError.value = null;
  mockPrepareDownload.mockResolvedValue({
    data: {
      prepareDownload: {
        ready: true,
        url: 'https://signed.example.com/file.zip',
        scanStatus: 'CLEAN',
        scanReason: null,
        reviewAccess: false,
        message: 'No threats found. Your download is ready.',
      },
    },
  });
});

describe('FunctionalDownloadNow', () => {
  it('prepares the download before opening the returned URL', async () => {
    const anchor = document.createElement('a');
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) =>
        tagName === 'a' ? anchor : originalCreateElement(tagName)
      );
    const wrapper = mountButton();

    await wrapper.get('.download-now-button').trigger('click');
    await flushPromises();

    expect({
      preparedWith: mockPrepareDownload.mock.calls,
      emitted: wrapper.emitted('downloaded'),
      toast: mockUpdateToast.mock.calls.at(-1),
    }).toEqual({
      preparedWith: [[{
        downloadableFileId: 'file-1',
        discussionId: 'discussion-1',
      }]],
      emitted: [[]],
      toast: ['toast-1', {
        message: 'No threats found in file.zip — download started.',
        type: 'success',
      }],
    });

    createElementSpy.mockRestore();
  });

  it('shows the checking toast while requesting the gated URL', async () => {
    const wrapper = mountButton();

    await wrapper.get('.download-now-button').trigger('click');

    expect(mockShowToast).toHaveBeenCalledWith(
      'Checking file.zip for threats…',
      'info'
    );
  });

  it('does not open a URL when the security scan blocks the download', async () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    mockPrepareDownload.mockResolvedValue({
      data: {
        prepareDownload: {
          ready: false,
          url: null,
          scanStatus: 'INFECTED',
          reviewAccess: false,
          message: 'This download was blocked by the security check.',
        },
      },
    });
    const wrapper = mountButton();

    await wrapper.get('.download-now-button').trigger('click');
    await flushPromises();

    expect({
      opened: appendSpy.mock.calls.length,
      emitted: wrapper.emitted('downloaded'),
      toast: mockUpdateToast.mock.calls.at(-1),
    }).toEqual({
      opened: 0,
      emitted: undefined,
      toast: ['toast-1', {
        message: 'This download was blocked by the security check.',
        type: 'error',
      }],
    });
  });

  it('does nothing when required download identifiers are missing', async () => {
    const wrapper = mountButton({ downloadableFileId: '' });

    await wrapper.get('.download-now-button').trigger('click');

    expect(mockPrepareDownload).not.toHaveBeenCalled();
  });
});

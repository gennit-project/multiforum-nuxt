import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import DownloadSidebar from '@/components/channel/DownloadSidebar.vue';
import { makeDiscussion } from '@/tests/utils/factories';

const authState = ref(false);
const mockUsernameRef = ref('');
const trackDownloadMock = vi.hoisted(() => vi.fn(() => Promise.resolve({
  data: {
    prepareDownload: {
      ready: true,
      url: 'https://signed.example.com/asset.zip',
      scanStatus: 'CLEAN',
      reviewAccess: false,
      message: 'No threats found. Your download is ready.',
    },
  },
})));

vi.mock('@/stores/toastStore', () => ({
  useToastStore: () => ({
    showToast: vi.fn(() => 'toast-1'),
    updateToast: vi.fn(),
  }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => mockUsernameRef,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    result: ref({
      discussions: [
        {
          DiscussionChannels: [
            {
              LabelOptions: [],
            },
          ],
        },
      ],
    }),
  })),
  useMutation: vi.fn(() => ({
    mutate: trackDownloadMock,
    loading: ref(false),
    error: ref(null),
    onDone: vi.fn(),
  })),
}));

vi.mock('@/components/auth/RequireAuth.vue', () => ({
  default: defineComponent({
    props: {
      fullWidth: Boolean,
    },
    template: `
      <div>
        <slot v-if="authState" name="has-auth" />
        <slot v-else name="does-not-have-auth" />
      </div>
    `,
    setup() {
      return { authState };
    },
  }),
}));

vi.mock('@/components/plugins/ScopedPipelineView.vue', () => ({
  default: defineComponent({
    template: '<div data-testid="pipeline-view" />',
  }),
}));

vi.mock('@/components/download/DownloadSuccessPopover.vue', () => ({
  default: defineComponent({
    props: {
      visible: Boolean,
    },
    template: '<div v-if="visible">Download success</div>',
  }),
}));

const discussionWithFile = makeDiscussion({
  id: 'discussion-1',
  title: 'Test Download',
  Author: {
    username: 'author',
    displayName: 'Author',
  },
  DownloadableFiles: [
    {
      id: 'file-1',
      fileName: 'asset.zip',
      url: 'https://example.com/asset.zip',
      kind: 'OTHER',
      size: 1024,
      priceModel: 'FREE',
      priceCents: 0,
      downloadCountTotal: 12,
      downloadCountUnique: 4,
      scanStatus: 'CLEAN',
      scanReason: null,
      license: {
        id: 'license-1',
        name: 'CC BY',
      },
    },
  ],
});

describe('DownloadSidebar', () => {
  beforeEach(() => {
    authState.value = false;
    mockUsernameRef.value = '';
    trackDownloadMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the login-gated download button to logged-out users without starting a download', async () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');

    const wrapper = mount(DownloadSidebar, {
      props: {
        discussion: discussionWithFile,
        discussionId: 'discussion-1',
        channelUniqueName: 'test-forum',
      },
    });

    const button = wrapper.get('button');

    expect(button.attributes('disabled')).toBeUndefined();

    await button.trigger('click');

    expect(appendSpy).not.toHaveBeenCalled();
    expect(trackDownloadMock).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain('Download success');
  });

  it('starts the download and shows the success popover to logged-in users', async () => {
    authState.value = true;

    const wrapper = mount(DownloadSidebar, {
      props: {
        discussion: discussionWithFile,
        discussionId: 'discussion-1',
        channelUniqueName: 'test-forum',
      },
    });

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(trackDownloadMock).toHaveBeenCalledWith({
      downloadableFileId: 'file-1',
      discussionId: 'discussion-1',
    });
    expect(wrapper.text()).toContain('Download success');
  });

  it('shows total and unique download counts', () => {
    const wrapper = mount(DownloadSidebar, {
      props: {
        discussion: discussionWithFile,
        discussionId: 'discussion-1',
        channelUniqueName: 'test-forum',
      },
    });

    expect(wrapper.text()).toContain('Total downloads');
    expect(wrapper.text()).toContain('12');
    expect(wrapper.text()).toContain('Unique downloaders');
    expect(wrapper.text()).toContain('4');
  });

  it('shows the unavailable message without rendering license details when no files exist', () => {
    const wrapper = mount(DownloadSidebar, {
      props: {
        discussion: {
          ...discussionWithFile,
          DownloadableFiles: [],
        },
        discussionId: 'discussion-1',
        channelUniqueName: 'test-forum',
      },
    });

    expect(wrapper.text()).toContain('No downloadable files available');
    expect(wrapper.text()).not.toContain('No license specified');
  });

  it('shows a pending scan and disables public download access', () => {
    const wrapper = mount(DownloadSidebar, {
      props: {
        discussion: makeDiscussion({
          ...discussionWithFile,
          DownloadableFiles: [
            {
              ...discussionWithFile.DownloadableFiles[0],
              url: '',
              scanStatus: 'PENDING',
            },
          ],
        }),
        discussionId: 'discussion-1',
        channelUniqueName: 'test-forum',
      },
    });

    expect({
      message: wrapper.get('[data-testid="download-scan-status"]').text(),
      disabled: wrapper.get('button').attributes('disabled'),
    }).toEqual({
      message: expect.stringContaining('Security scan in progress'),
      disabled: '',
    });
  });

  it('gives the creator cause-aware blocked copy and review actions', () => {
    authState.value = true;
    mockUsernameRef.value = 'author';
    const wrapper = mount(DownloadSidebar, {
      props: {
        discussion: makeDiscussion({
          ...discussionWithFile,
          DownloadableFiles: [
            {
              ...discussionWithFile.DownloadableFiles[0],
              scanStatus: 'INFECTED',
              scanReason: 'Known malware signature',
            },
          ],
        }),
        discussionId: 'discussion-1',
        channelUniqueName: 'test-forum',
      },
    });

    expect({
      status: wrapper.get('[data-testid="download-scan-status"]').text(),
      button: wrapper.findAll('button').find((button) =>
        button.text() === 'Download for review'
      )?.text(),
    }).toEqual({
      status: expect.stringContaining(
        'This upload was blocked by the security scan: Known malware signature.'
      ),
      button: 'Download for review',
    });
  });

  it('does not expose the scan reason to other viewers', () => {
    const wrapper = mount(DownloadSidebar, {
      props: {
        discussion: makeDiscussion({
          ...discussionWithFile,
          DownloadableFiles: [
            {
              ...discussionWithFile.DownloadableFiles[0],
              url: '',
              scanStatus: 'SUSPICIOUS',
              scanReason: 'Private scanner detail',
            },
          ],
        }),
        discussionId: 'discussion-1',
        channelUniqueName: 'test-forum',
      },
    });

    expect(wrapper.text()).not.toContain('Private scanner detail');
  });

  it('sends a targeted human-review request for the creator', async () => {
    mockUsernameRef.value = 'author';
    const wrapper = mount(DownloadSidebar, {
      props: {
        discussion: makeDiscussion({
          ...discussionWithFile,
          DownloadableFiles: [
            {
              ...discussionWithFile.DownloadableFiles[0],
              scanStatus: 'SUSPICIOUS',
            },
          ],
        }),
        discussionId: 'discussion-1',
        channelUniqueName: 'test-forum',
      },
    });

    await wrapper.get('[data-testid="download-scan-status"] button').trigger('click');

    expect(trackDownloadMock).toHaveBeenCalledWith({
      downloadableFileId: 'file-1',
      reason: null,
    });
  });

  it('shows when human review was already requested', () => {
    mockUsernameRef.value = 'author';
    const wrapper = mount(DownloadSidebar, {
      props: {
        discussion: makeDiscussion({
          ...discussionWithFile,
          DownloadableFiles: [
            {
              ...discussionWithFile.DownloadableFiles[0],
              scanStatus: 'SUSPICIOUS',
              reviewRequestedAt: '2026-07-19T00:00:00Z',
            },
          ],
        }),
        discussionId: 'discussion-1',
        channelUniqueName: 'test-forum',
      },
    });

    expect(wrapper.get('[data-testid="download-scan-status"] button').text()).toBe(
      'Human review requested'
    );
  });

  it('identifies a failed scan as a server-side problem for the creator', () => {
    mockUsernameRef.value = 'author';
    const wrapper = mount(DownloadSidebar, {
      props: {
        discussion: makeDiscussion({
          ...discussionWithFile,
          DownloadableFiles: [
            {
              ...discussionWithFile.DownloadableFiles[0],
              scanStatus: 'FAILED',
              scanReason: 'Service unreachable',
            },
          ],
        }),
        discussionId: 'discussion-1',
        channelUniqueName: 'test-forum',
      },
    });

    expect(wrapper.get('[data-testid="download-scan-status"]').text()).toContain(
      "a problem on our end, not your file"
    );
  });

  it('lets the creator retry a failed scan', async () => {
    mockUsernameRef.value = 'author';
    const wrapper = mount(DownloadSidebar, {
      props: {
        discussion: makeDiscussion({
          ...discussionWithFile,
          DownloadableFiles: [
            {
              ...discussionWithFile.DownloadableFiles[0],
              scanStatus: 'FAILED',
            },
          ],
        }),
        discussionId: 'discussion-1',
        channelUniqueName: 'test-forum',
      },
    });

    await wrapper.get('[data-testid="download-scan-status"] button').trigger('click');

    expect(trackDownloadMock).toHaveBeenCalledWith({
      downloadableFileId: 'file-1',
    });
  });
});

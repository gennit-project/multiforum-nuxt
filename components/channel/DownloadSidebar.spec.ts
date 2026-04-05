import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import DownloadSidebar from '@/components/channel/DownloadSidebar.vue';

const authState = ref(false);

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

const discussionWithFile = {
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
      license: {
        id: 'license-1',
        name: 'CC BY',
      },
    },
  ],
};

describe('DownloadSidebar', () => {
  beforeEach(() => {
    authState.value = false;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows the login-gated download button to logged-out users without starting a download', async () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');

    const wrapper = mount(DownloadSidebar, {
      props: {
        discussion: discussionWithFile as any,
        discussionId: 'discussion-1',
        channelUniqueName: 'test-forum',
      },
    });

    const button = wrapper.get('button');

    expect(button.attributes('disabled')).toBeUndefined();

    await button.trigger('click');
    vi.runAllTimers();

    expect(appendSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain('Download success');
  });

  it('starts the download and shows the success popover to logged-in users', async () => {
    authState.value = true;

    const wrapper = mount(DownloadSidebar, {
      props: {
        discussion: discussionWithFile as any,
        discussionId: 'discussion-1',
        channelUniqueName: 'test-forum',
      },
    });

    await wrapper.get('button').trigger('click');
    vi.advanceTimersByTime(500);
    await nextTick();

    expect(wrapper.text()).toContain('Download success');
  });

  it('shows the unavailable message without rendering license details when no files exist', () => {
    const wrapper = mount(DownloadSidebar, {
      props: {
        discussion: {
          ...discussionWithFile,
          DownloadableFiles: [],
        } as any,
        discussionId: 'discussion-1',
        channelUniqueName: 'test-forum',
      },
    });

    expect(wrapper.text()).toContain('No downloadable files available');
    expect(wrapper.text()).not.toContain('No license specified');
  });
});

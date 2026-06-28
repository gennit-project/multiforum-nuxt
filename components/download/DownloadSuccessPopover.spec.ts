import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import DownloadSuccessPopover from '@/components/download/DownloadSuccessPopover.vue';

const baseDiscussion = {
  id: 'discussion-1',
  title: 'Useful Download',
  Author: {
    username: 'alice',
    displayName: 'Alice',
  },
  DownloadableFiles: [
    {
      id: 'file-1',
      fileName: 'asset.zip',
      attributionOverride: '',
      supportPatreonUrl: '',
      supportBuyMeACoffeeUrl: '',
      supportKoFiUrl: '',
      supportPayPalMeUrl: '',
    },
  ],
};

const mountPopover = (discussion: unknown = baseDiscussion) =>
  mount(DownloadSuccessPopover, {
    props: { discussion: discussion as never, visible: true },
  });

// Find a button by its (trimmed) visible text. `exact` distinguishes the
// "Copy" attribution button from the "Copy Link" share button.
const button = (
  wrapper: ReturnType<typeof mountPopover>,
  label: string,
  exact = false
) =>
  wrapper
    .findAll('button')
    .find((b) =>
      exact ? b.text().trim() === label : b.text().includes(label)
    );

describe('DownloadSuccessPopover', () => {
  it('does not render the support section when no support links are configured', () => {
    const wrapper = mount(DownloadSuccessPopover, {
      props: {
        discussion: baseDiscussion as any,
        visible: true,
      },
    });

    expect(wrapper.text()).not.toContain('Support the uploader');
  });

  it('renders custom attribution and configured support links', () => {
    const wrapper = mount(DownloadSuccessPopover, {
      props: {
        discussion: {
          ...baseDiscussion,
          DownloadableFiles: [
            {
              ...baseDiscussion.DownloadableFiles[0],
              attributionOverride: 'Please credit Alice Studio.',
              supportPatreonUrl: 'https://patreon.com/alice',
              supportKoFiUrl: 'https://ko-fi.com/alice',
            },
          ],
        } as any,
        visible: true,
      },
    });

    expect(wrapper.text()).toContain('Please credit Alice Studio.');
    expect(wrapper.text()).toContain('Support the uploader');
    expect(wrapper.text()).toContain('Patreon');
    expect(wrapper.text()).toContain('Ko-fi');
    expect(wrapper.find('a[href="https://patreon.com/alice"]').exists()).toBe(
      true
    );
    expect(wrapper.find('a[href="https://ko-fi.com/alice"]').exists()).toBe(
      true
    );
  });

  describe('attribution text', () => {
    it('formats the default attribution as title by displayName (username)', () => {
      const wrapper = mountPopover();
      expect(wrapper.text()).toContain('"Useful Download" by Alice (alice)');
    });

    it('falls back to Unknown when there is no author', () => {
      const wrapper = mountPopover({
        ...baseDiscussion,
        Author: null,
        DownloadableFiles: [{ ...baseDiscussion.DownloadableFiles[0] }],
      });
      expect(wrapper.text()).toContain('by Unknown');
    });
  });

  describe('sharing', () => {
    const openSpy = vi.fn();

    beforeEach(() => {
      openSpy.mockReset();
      vi.stubGlobal('open', openSpy);
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    const cases: Array<[string, string]> = [
      ['Facebook', 'facebook.com/sharer'],
      ['Pinterest', 'pinterest.com/pin/create'],
      ['Tumblr', 'tumblr.com/widgets/share'],
      ['Reddit', 'reddit.com/submit'],
      ['Bluesky', 'bsky.app/intent/compose'],
    ];

    for (const [label, host] of cases) {
      it(`opens a ${label} share window`, async () => {
        const wrapper = mountPopover();
        await button(wrapper, label)!.trigger('click');
        expect(openSpy).toHaveBeenCalledWith(
          expect.stringContaining(host),
          '_blank',
          expect.any(String)
        );
      });
    }
  });

  describe('clipboard actions', () => {
    const writeText = vi.fn();

    beforeEach(() => {
      writeText.mockReset().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });
    });

    it('copies the share link and flips the label to Copied!', async () => {
      const wrapper = mountPopover();
      const copyLink = button(wrapper, 'Copy Link')!;
      await copyLink.trigger('click');
      await flushPromises();
      expect(writeText).toHaveBeenCalledTimes(1);
      expect(button(wrapper, 'Copied!')).toBeTruthy();
    });

    it('copies the attribution text', async () => {
      const wrapper = mountPopover();
      await button(wrapper, 'Copy', true)!.trigger('click');
      await flushPromises();
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining('"Useful Download" by Alice (alice)')
      );
    });
  });

  describe('dismissal', () => {
    it('emits close when the close button is clicked', async () => {
      const wrapper = mountPopover();
      // The first button in the popover is the corner close button.
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });
});

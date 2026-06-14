import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
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
});

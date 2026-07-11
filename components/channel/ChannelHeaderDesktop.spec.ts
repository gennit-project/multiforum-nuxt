import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ChannelHeaderDesktop from './ChannelHeaderDesktop.vue';

const mountHeader = (channel: Record<string, unknown>) =>
  mount(ChannelHeaderDesktop, {
    props: {
      adminList: [],
      channelId: 'cats',
      channel,
      route: {},
      showCreateButton: false,
    },
  });

describe('ChannelHeaderDesktop', () => {
  it('renders the banner image when the channel has a banner URL', () => {
    const wrapper = mountHeader({ channelBannerURL: 'https://img/banner.png' });
    expect(wrapper.find('img').attributes('src')).toBe(
      'https://img/banner.png'
    );
  });

  it('renders no banner image when the channel has no banner URL', () => {
    const wrapper = mountHeader({ channelBannerURL: null });
    expect(wrapper.find('img').exists()).toBe(false);
  });
});

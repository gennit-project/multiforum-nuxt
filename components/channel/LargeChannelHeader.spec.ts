import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import LargeChannelHeader from '@/components/channel/LargeChannelHeader.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const channelIconStub = defineComponent({
  name: 'ChannelIcon',
  template: '<div class="channel-icon-stub" />',
});

const mountHeader = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) =>
  mountWithDefaults(LargeChannelHeader, {
    props: {
      channelId: 'cats',
      ...props,
    },
    slots,
    global: {
      stubs: {
        ChannelIcon: channelIconStub,
      },
    },
  });

describe('LargeChannelHeader', () => {
  it('renders the channel id as the heading', () => {
    const wrapper = mountHeader();

    expect(wrapper.get('h1').text()).toBe('cats');
  });

  it('renders the channel icon', () => {
    const wrapper = mountHeader();

    expect(wrapper.find('.channel-icon-stub').exists()).toBe(true);
  });

  it('renders slot content beneath the header', () => {
    const wrapper = mountHeader({}, { default: '<div data-testid="slot-content">body</div>' });

    expect(wrapper.get('[data-testid="slot-content"]').text()).toBe('body');
  });
});

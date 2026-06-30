import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ChannelIconStack from './ChannelIconStack.vue';

const mountStack = (
  channels = [{ uniqueName: 'cats', iconURL: 'cats.png' }]
) =>
  mount(ChannelIconStack, {
    props: { channels },
    global: {
      stubs: {
        AvatarComponent: true,
      },
    },
  });

describe('ChannelIconStack', () => {
  it('renders one item per visible channel', () => {
    const wrapper = mountStack([
      { uniqueName: 'cats', iconURL: 'cats.png' },
      { uniqueName: 'dogs', iconURL: 'dogs.png' },
    ]);

    expect(wrapper.findAll('[class~="group/chicon"]')).toHaveLength(2);
  });

  it('caps visible items at three by default', () => {
    const wrapper = mountStack([
      { uniqueName: 'a', iconURL: '' },
      { uniqueName: 'b', iconURL: '' },
      { uniqueName: 'c', iconURL: '' },
      { uniqueName: 'd', iconURL: '' },
    ]);

    expect(wrapper.findAll('[class~="group/chicon"]')).toHaveLength(3);
  });

  it('shows the extra-count label when more than three channels exist', () => {
    const wrapper = mountStack([
      { uniqueName: 'a', iconURL: '' },
      { uniqueName: 'b', iconURL: '' },
      { uniqueName: 'c', iconURL: '' },
      { uniqueName: 'd', iconURL: '' },
    ]);

    expect(wrapper.text()).toContain('and 1 more');
  });

  it('omits the extra-count label when disabled', () => {
    const wrapper = mount(ChannelIconStack, {
      props: {
        channels: [
          { uniqueName: 'a', iconURL: '' },
          { uniqueName: 'b', iconURL: '' },
          { uniqueName: 'c', iconURL: '' },
          { uniqueName: 'd', iconURL: '' },
        ],
        showExtraCount: false,
      },
      global: {
        stubs: {
          AvatarComponent: true,
        },
      },
    });

    expect(wrapper.text()).not.toContain('more');
  });
});

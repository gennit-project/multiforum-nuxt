import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ChannelSidebarButton from '@/components/channel/ChannelSidebarButton.vue';

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock('nuxt/app', () => {
  return {
    useRouter: () => ({ push: mockPush }),
  };
});

const mountButton = (props = {}) =>
  mount(ChannelSidebarButton, {
    props: {
      to: '/forums/support',
      label: 'Support',
      ...props,
    },
    slots: {
      default: '<span data-testid="icon">#</span>',
    },
  });

describe('ChannelSidebarButton', () => {
  it('routes to the target path when enabled', async () => {
    const wrapper = mountButton();

    await wrapper.get('button').trigger('click');

    expect(mockPush).toHaveBeenCalledWith('/forums/support');
  });

  it('does not route when disabled', async () => {
    mockPush.mockClear();
    const wrapper = mountButton({ disabled: true });

    await wrapper.get('button').trigger('click');

    expect(mockPush).not.toHaveBeenCalled();
  });
});

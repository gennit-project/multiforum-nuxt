import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import ChannelHeaderMobile from './ChannelHeaderMobile.vue';

const mockIsAuthenticated = ref(false);
vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => mockIsAuthenticated,
}));

const mountHeader = (channel: Record<string, unknown>) =>
  mount(ChannelHeaderMobile, {
    props: { channelId: 'cats', channel },
    global: {
      stubs: {
        AvatarComponent: true,
        ClientOnly: { template: '<div><slot /></div>' },
        AddToChannelFavorites: { template: '<div class="fav" />' },
      },
    },
  });

describe('ChannelHeaderMobile', () => {
  it('renders the display name and unique name', () => {
    const wrapper = mountHeader({ displayName: 'Cats', uniqueName: 'cats' });
    expect(wrapper.text()).toContain('Cats');
  });

  it('falls back to the channel id when there is no display name', () => {
    expect(mountHeader({}).text()).toContain('cats');
  });

  it('shows the favorite button when authenticated', () => {
    mockIsAuthenticated.value = true;
    expect(
      mountHeader({ displayName: 'Cats', uniqueName: 'cats' }).find('.fav').exists()
    ).toBe(true);
  });

  it('hides the favorite button when not authenticated', () => {
    mockIsAuthenticated.value = false;
    expect(
      mountHeader({ displayName: 'Cats', uniqueName: 'cats' }).find('.fav').exists()
    ).toBe(false);
  });
});

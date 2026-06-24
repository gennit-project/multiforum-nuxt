import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';

const mountUsername = (props: Record<string, unknown> = {}) =>
  mount(UsernameWithTooltip, {
    props: { username: 'alice', ...props },
    global: {
      stubs: {
        ClientOnly: { template: '<div><slot /></div>' },
        'v-tooltip': {
          name: 'VTooltip',
          template: '<div><slot name="activator" :props="{}" /><slot /></div>',
        },
        AvatarComponent: true,
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

describe('UsernameWithTooltip name', () => {
  it('shows the username when there is no display name', () => {
    const wrapper = mountUsername();

    expect(wrapper.text()).toContain('alice');
  });

  it('shows the display name and handle when a display name is set', () => {
    const wrapper = mountUsername({ displayName: 'Alice A' });

    expect(wrapper.text()).toContain('Alice A');
  });

  it('shows the u/ handle alongside a display name', () => {
    const wrapper = mountUsername({ displayName: 'Alice A' });

    expect(wrapper.text()).toContain('(u/alice)');
  });
});

describe('UsernameWithTooltip badges', () => {
  it('shows an Admin badge', () => {
    const wrapper = mountUsername({ isAdmin: true });

    expect(wrapper.text()).toContain('Admin');
  });

  it('shows a Mod badge when not an admin', () => {
    const wrapper = mountUsername({ isMod: true });

    expect(wrapper.text()).toContain('Mod');
  });

  it('prefers the Admin badge over Mod', () => {
    const wrapper = mountUsername({ isAdmin: true, isMod: true });

    expect(wrapper.text()).not.toContain('Mod');
  });

  it('shows an OP badge', () => {
    const wrapper = mountUsername({ isOriginalPoster: true });

    expect(wrapper.text()).toContain('OP');
  });
});

describe('UsernameWithTooltip tooltip content', () => {
  it('shows karma counts in the tooltip', () => {
    const wrapper = mountUsername({ commentKarma: 5, discussionKarma: 9 });

    expect(wrapper.text()).toContain('5 comment karma');
  });

  it('shows the account-created line when a date is given', () => {
    const wrapper = mountUsername({ accountCreated: '2020-01-01T00:00:00Z' });

    expect(wrapper.text()).toContain('account created');
  });

  it('omits tooltip content when the tooltip is disabled', () => {
    const wrapper = mountUsername({ disableTooltip: true, commentKarma: 5 });

    expect(wrapper.text()).not.toContain('comment karma');
  });
});

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

// @floating-ui/vue's useFloating + autoUpdate loops under jsdom (no real layout),
// so stub it — this suite exercises MenuButton's open/close and item logic, not
// floating-ui's positioning math.
vi.mock('@floating-ui/vue', () => ({
  useFloating: () => ({ floatingStyles: ref({}) }),
  offset: () => ({}),
  flip: () => ({}),
  shift: () => ({}),
  autoUpdate: () => () => {},
}));

import MenuButton from '@/components/MenuButton.vue';
// The dropdown panel is client-only + teleported to <body>; render both inline
// so assertions can query the menu items within the wrapper.
const stubs = {
  ClientOnly: {
    template: '<div><slot /></div>',
  },
  Teleport: {
    template: '<div><slot /></div>',
  },
  NuxtLink: {
    props: ['to'],
    template:
      '<a :href="typeof to === \'string\' ? to : to.path"><slot /></a>',
  },
  ChevronDownIcon: true,
};

const mountMenu = (props: Record<string, unknown> = {}) =>
  mount(MenuButton, {
    props: {
      dataTestid: 'actions',
      ariaLabel: 'Comment actions',
      items: [],
      ...props,
    },
    global: { stubs },
  });

// Open the menu by clicking the default trigger, so the (v-if) panel renders.
const openMenu = async (wrapper: ReturnType<typeof mountMenu>) => {
  await wrapper.get('[data-testid="actions"]').trigger('click');
  return wrapper;
};

describe('MenuButton', () => {
  it('renders the default activator with accessible label and marked-answer classes', () => {
    const wrapper = mountMenu({ isMarkedAsAnswer: true });
    const button = wrapper.get('[data-testid="actions"]');

    expect({
      label: button.attributes('aria-label'),
      green: button.classes().some((className) => className.includes('green')),
      text: button.text(),
    }).toEqual({
      label: 'Comment actions',
      green: true,
      text: 'Options',
    });
  });

  it('disables the default activator when disabled', () => {
    const wrapper = mountMenu({ disabled: true });
    const button = wrapper.get('[data-testid="actions"]');

    expect({
      disabled: button.attributes('disabled'),
      className: button.attributes('class'),
    }).toEqual({
      disabled: '',
      className: expect.stringContaining('cursor-not-allowed'),
    });
  });

  it('renders dividers, route links, and event items when open', async () => {
    const wrapper = await openMenu(
      mountMenu({
        items: [
          { label: 'Group', value: 'Moderation', isDivider: true },
          { label: 'Open', value: '/forums/support', icon: '' },
          { label: 'Object route', value: { path: '/object-route' }, icon: '' },
          { label: 'Archive', value: 'archive-id', event: 'archive', icon: '' },
        ],
      })
    );

    expect({
      text: wrapper.text(),
      links: wrapper.findAll('a').map((link) => link.attributes('href')),
    }).toEqual({
      text: expect.stringContaining('Moderation'),
      links: ['/forums/support', '/object-route'],
    });
  });

  it('emits the configured event when an event menu item is clicked', async () => {
    const wrapper = await openMenu(
      mountMenu({
        items: [
          { label: 'Archive', value: 'archive-id', event: 'archive', icon: '' },
        ],
      })
    );

    await wrapper.get('[data-testid="actions-item-Archive"]').trigger('click');

    expect(wrapper.emitted('archive')).toEqual([[]]);
  });

  it('passes disabled state to a custom activator slot', () => {
    const wrapper = mount(MenuButton, {
      props: {
        disabled: true,
        items: [],
      },
      slots: {
        activator:
          '<template #activator="{ disabled }"><button data-testid="custom">{{ disabled }}</button></template>',
      },
      global: { stubs },
    });

    expect(wrapper.get('[data-testid="custom"]').text()).toBe('true');
  });

  it('passes menu semantics to a custom activator slot', () => {
    const wrapper = mount(MenuButton, {
      props: {
        items: [],
      },
      slots: {
        activator:
          '<template #activator="{ props }"><button data-testid="custom" v-bind="props">Open</button></template>',
      },
      global: { stubs },
    });

    expect({
      hasPopup: wrapper.get('[data-testid="custom"]').attributes('aria-haspopup'),
      expanded: wrapper.get('[data-testid="custom"]').attributes('aria-expanded'),
    }).toEqual({
      hasPopup: 'menu',
      expanded: 'false',
    });
  });
});

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import MenuButton from '@/components/MenuButton.vue';

const stubs = {
  ClientOnly: {
    template: '<div><slot /></div>',
  },
  VMenu: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<div><slot name="activator" :props="{ onClick: () => $emit(\'update:modelValue\', true) }" /><slot /></div>',
  },
  VList: {
    template: '<div role="menu"><slot /></div>',
  },
  VListItem: {
    emits: ['click'],
    template: '<div role="menuitem" @click="$emit(\'click\', $event)"><slot /></div>',
  },
  VListSubheader: {
    template: '<div role="presentation"><slot /></div>',
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

  it('renders dividers, route links, and event items', () => {
    const wrapper = mountMenu({
      items: [
        { label: 'Group', value: 'Moderation', isDivider: true },
        { label: 'Open', value: '/forums/support', icon: '' },
        { label: 'Object route', value: { path: '/object-route' }, icon: '' },
        { label: 'Archive', value: 'archive-id', event: 'archive', icon: '' },
      ],
    });

    expect({
      text: wrapper.text(),
      links: wrapper.findAll('a').map((link) => link.attributes('href')),
    }).toEqual({
      text: expect.stringContaining('Moderation'),
      links: ['/forums/support', '/object-route'],
    });
  });

  it('emits the configured event when an event menu item is clicked', async () => {
    const wrapper = mountMenu({
      items: [{ label: 'Archive', value: 'archive-id', event: 'archive', icon: '' }],
    });

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
});

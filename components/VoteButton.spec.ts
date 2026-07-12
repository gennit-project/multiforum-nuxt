import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import VoteButton from '@/components/VoteButton.vue';

const authButtonStub = {
  name: 'AuthButton',
  props: ['testId', 'buttonClasses', 'props', 'loading', 'showCount', 'count'],
  emits: ['click'],
  template: '<button :data-classes="buttonClasses" @click="$emit(\'click\')"><slot /></button>',
};

const mountButton = (
  props: Record<string, unknown> = {},
  slot = 'X',
  customStubs: Record<string, unknown> = {}
) =>
  mount(VoteButton, {
    props,
    slots: { default: slot },
    global: {
      stubs: {
        AuthButton: authButtonStub,
        ClientOnly: { template: '<div><slot /></div>' },
        Tooltip: { template: '<div><slot name="activator" :props="{}" /><slot /></div>' },
        TooltipContent: true,
        ...customStubs,
      },
    },
  });

const authButton = (w: ReturnType<typeof mount>) => w.getComponent(authButtonStub);
const classes = (w: ReturnType<typeof mount>) => authButton(w).props('buttonClasses') as string;

describe('VoteButton classes', () => {
  it('uses orange styling when active', () => {
    const wrapper = mountButton({ active: true });

    expect(classes(wrapper)).toContain('bg-orange-400');
  });

  it('uses gray styling when inactive', () => {
    const wrapper = mountButton({ active: false });

    expect(classes(wrapper)).toContain('bg-gray-100');
  });

  it('uses green styling for an active best answer', () => {
    const wrapper = mountButton({ isMarkedAsAnswer: true, active: true });

    expect(classes(wrapper)).toContain('bg-green-500');
  });

  it('uses light-green styling for an inactive best answer', () => {
    const wrapper = mountButton({ isMarkedAsAnswer: true, active: false });

    expect(classes(wrapper)).toContain('bg-green-100');
  });

  it('adds permalink styling when permalinked', () => {
    const wrapper = mountButton({ isPermalinked: true });

    expect(classes(wrapper)).toContain('border-orange-500');
  });

  it('includes the external class', () => {
    const wrapper = mountButton({ class: 'my-extra-class' });

    expect(classes(wrapper)).toContain('my-extra-class');
  });

  it('uses transparent styling when requested', () => {
    const wrapper = mountButton({ transparentBackground: true });

    expect(classes(wrapper)).toContain('bg-black/5');
  });
});

describe('VoteButton rendering', () => {
  it('renders the slot content', () => {
    const wrapper = mountButton({}, 'Upvote');

    expect(wrapper.text()).toContain('Upvote');
  });

  it('forwards the count to the button', () => {
    const wrapper = mountButton({ count: 9, showCount: true });

    expect(authButton(wrapper).props('count')).toBe(9);
  });

  it('emits vote on click without a tooltip', async () => {
    const wrapper = mountButton();

    await authButton(wrapper).trigger('click');

    expect(wrapper.emitted('vote')).toBeTruthy();
  });

  it('renders inside a tooltip when tooltipText is set', () => {
    const wrapper = mountButton({ tooltipText: 'Upvote this' });

    expect(authButton(wrapper).exists()).toBe(true);
  });

  it('emits vote from the tooltip activator button', async () => {
    const wrapper = mountButton({ tooltipText: 'Upvote this' });

    await authButton(wrapper).trigger('click');

    expect(wrapper.emitted('vote')).toBeTruthy();
  });

  it('emits vote from the tooltip fallback button', async () => {
    const wrapper = mountButton(
      { tooltipText: 'Upvote this' },
      'Upvote',
      {
        ClientOnly: {
          template: '<div><slot name="fallback" /></div>',
        },
      }
    );

    await authButton(wrapper).trigger('click');

    expect(wrapper.emitted('vote')).toBeTruthy();
  });
});

describe('VoteButton accessibility', () => {
  const forwardedProps = (w: ReturnType<typeof mount>) =>
    authButton(w).props('props') as Record<string, unknown>;

  it('exposes the pressed state to assistive tech when active', () => {
    const wrapper = mountButton({ active: true });

    expect(forwardedProps(wrapper)['aria-pressed']).toBe(true);
  });

  it('exposes the unpressed state to assistive tech when inactive', () => {
    const wrapper = mountButton({ active: false });

    expect(forwardedProps(wrapper)['aria-pressed']).toBe(false);
  });

  it('forwards the ariaLabel prop as the button accessible name', () => {
    const wrapper = mountButton({ ariaLabel: 'Upvote' });

    expect(forwardedProps(wrapper)['aria-label']).toBe('Upvote');
  });

  it('omits aria-label when no ariaLabel is provided', () => {
    const wrapper = mountButton();

    expect(forwardedProps(wrapper)).not.toHaveProperty('aria-label');
  });
});

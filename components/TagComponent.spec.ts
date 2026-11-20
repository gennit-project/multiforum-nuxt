import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import TagComponent from '@/components/TagComponent.vue';

const mountTag = (props: Record<string, unknown> = {}) =>
  mount(TagComponent, {
    props: { tag: 'pets', ...props },
    global: {
      stubs: {
        AvatarComponent: {
          name: 'AvatarComponent',
          template: '<div class="avatar" />',
        },
        XmarkIcon: true,
      },
    },
  });

const tagEl = (w: ReturnType<typeof mount>) => w.find('span.tag');

describe('TagComponent rendering', () => {
  it('shows the tag text', () => {
    const wrapper = mountTag();

    expect(wrapper.text()).toContain('pets');
  });

  it('uses active styling when active', () => {
    const wrapper = mountTag({ active: true });

    expect(tagEl(wrapper).classes().join(' ')).toContain('bg-brand-400');
  });

  it('keeps a single dark hover background with light text on interactive tags', () => {
    const wrapper = mountTag({ interactive: true });
    const classes = tagEl(wrapper).classes();

    expect({
      hoverBgs: classes.filter((c) => c.startsWith('dark:hover:bg-')),
      hoverText: classes.filter((c) => c.startsWith('dark:hover:text-')),
    }).toEqual({
      hoverBgs: ['dark:hover:bg-gray-600'],
      hoverText: ['dark:hover:text-white'],
    });
  });

  it('uses channel styling in channel mode', () => {
    const wrapper = mountTag({ channelMode: true });

    expect(tagEl(wrapper).classes().join(' ')).toContain('bg-gray-200');
  });

  it('shows the avatar in channel mode', () => {
    const wrapper = mountTag({ channelMode: true });

    expect(wrapper.find('.avatar').exists()).toBe(true);
  });

  it('hides the avatar when hideIcon is set', () => {
    const wrapper = mountTag({ channelMode: true, hideIcon: true });

    expect(wrapper.find('.avatar').exists()).toBe(false);
  });
});

describe('TagComponent hover rule', () => {
  const hoverClasses = (w: ReturnType<typeof mount>) =>
    tagEl(w)
      .classes()
      .filter((c) => c.includes('hover:'));

  it.each([
    ['default', {}],
    ['active', { active: true }],
    ['channel mode', { channelMode: true }],
  ])(
    'has no hover styles when a %s tag is not interactive',
    (_label, props) => {
      const wrapper = mountTag(props);

      expect(hoverClasses(wrapper)).toEqual([]);
    }
  );

  it.each([
    ['default', {}],
    ['active', { active: true }],
    ['channel mode', { channelMode: true }],
  ])('has hover styles when a %s tag is interactive', (_label, props) => {
    const wrapper = mountTag({ ...props, interactive: true });

    expect(hoverClasses(wrapper).length).toBeGreaterThan(0);
  });

  it('only shows a pointer cursor when interactive', () => {
    const wrapper = mountTag();

    expect(tagEl(wrapper).classes()).not.toContain('cursor-pointer');
  });

  it('renders a non-interactive tag without a button', () => {
    const wrapper = mountTag();

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('does not emit select when a non-interactive tag is clicked', async () => {
    const wrapper = mountTag();

    await wrapper.find('span.tag > span').trigger('click');

    expect(wrapper.emitted('select')).toBeUndefined();
  });
});

describe('TagComponent interaction', () => {
  // The tag content is a real <button> (first button in the tag); the clear
  // control, when present, is a separate button with data-testid tag-delete.
  const selectButton = (w: ReturnType<typeof mountTag>) => w.get('button');

  it('emits select when clicked while inactive', async () => {
    const wrapper = mountTag({ interactive: true });

    await selectButton(wrapper).trigger('click');

    expect(wrapper.emitted('select')?.[0]).toEqual(['pets']);
  });

  it('emits deselect when clicked while active', async () => {
    const wrapper = mountTag({ interactive: true, active: true });

    await selectButton(wrapper).trigger('click');

    expect(wrapper.emitted('deselect')?.[0]).toEqual(['pets']);
  });

  it('renders the tag as a keyboard-operable button', () => {
    const wrapper = mountTag({ interactive: true });

    expect(selectButton(wrapper).element.tagName).toBe('BUTTON');
  });

  it('exposes the selected state via aria-pressed', () => {
    const wrapper = mountTag({ interactive: true, active: true });

    expect(selectButton(wrapper).attributes('aria-pressed')).toBe('true');
  });

  it('shows the clear icon when clearable', () => {
    const wrapper = mountTag({ clearable: true });

    expect(wrapper.find('[data-testid="tag-delete"]').exists()).toBe(true);
  });

  it('gives the clear control an accessible name', () => {
    const wrapper = mountTag({ clearable: true });

    expect(
      wrapper.get('[data-testid="tag-delete"]').attributes('aria-label')
    ).toBe('Remove pets');
  });

  it('emits delete with the index from the clear icon', async () => {
    const wrapper = mountTag({ clearable: true, index: 3 });

    await wrapper.find('[data-testid="tag-delete"]').trigger('click');

    expect(wrapper.emitted('delete')?.[0]).toEqual([3]);
  });
});

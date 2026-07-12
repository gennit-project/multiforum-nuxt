import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import TagComponent from '@/components/TagComponent.vue';

const mountTag = (props: Record<string, unknown> = {}) =>
  mount(TagComponent, {
    props: { tag: 'pets', ...props },
    global: { stubs: { AvatarComponent: { name: 'AvatarComponent', template: '<div class="avatar" />' }, XmarkIcon: true } },
  });

const tagEl = (w: ReturnType<typeof mount>) => w.find('span.tag');

describe('TagComponent rendering', () => {
  it('shows the tag text', () => {
    const wrapper = mountTag();

    expect(wrapper.text()).toContain('pets');
  });

  it('uses active styling when active', () => {
    const wrapper = mountTag({ active: true });

    expect(tagEl(wrapper).classes().join(' ')).toContain('bg-orange-400');
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

describe('TagComponent interaction', () => {
  // The tag content is a real <button> (first button in the tag); the clear
  // control, when present, is a separate button with data-testid tag-delete.
  const selectButton = (w: ReturnType<typeof mountTag>) => w.get('button');

  it('emits select when clicked while inactive', async () => {
    const wrapper = mountTag();

    await selectButton(wrapper).trigger('click');

    expect(wrapper.emitted('select')?.[0]).toEqual(['pets']);
  });

  it('emits deselect when clicked while active', async () => {
    const wrapper = mountTag({ active: true });

    await selectButton(wrapper).trigger('click');

    expect(wrapper.emitted('deselect')?.[0]).toEqual(['pets']);
  });

  it('renders the tag as a keyboard-operable button', () => {
    const wrapper = mountTag();

    expect(selectButton(wrapper).element.tagName).toBe('BUTTON');
  });

  it('exposes the selected state via aria-pressed', () => {
    const wrapper = mountTag({ active: true });

    expect(selectButton(wrapper).attributes('aria-pressed')).toBe('true');
  });

  it('shows the clear icon when clearable', () => {
    const wrapper = mountTag({ clearable: true });

    expect(wrapper.find('[data-testid="tag-delete"]').exists()).toBe(true);
  });

  it('gives the clear control an accessible name', () => {
    const wrapper = mountTag({ clearable: true });

    expect(wrapper.get('[data-testid="tag-delete"]').attributes('aria-label')).toBe(
      'Remove pets'
    );
  });

  it('emits delete with the index from the clear icon', async () => {
    const wrapper = mountTag({ clearable: true, index: 3 });

    await wrapper.find('[data-testid="tag-delete"]').trigger('click');

    expect(wrapper.emitted('delete')?.[0]).toEqual([3]);
  });
});

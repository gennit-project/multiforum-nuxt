import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import FileTypePicker from '@/components/FileTypePicker.vue';

const listStub = {
  name: 'SearchableFileTypeList',
  props: ['selectedFileTypes'],
  emits: ['toggle-selection'],
  template: '<div class="list" />',
};

const mountPicker = (props: Record<string, unknown> = {}) =>
  mount(FileTypePicker, {
    props,
    global: {
      stubs: { SearchableFileTypeList: listStub },
      directives: { clickOutside: {}, 'click-outside': {} },
    },
  });

const box = (w: ReturnType<typeof mount>) => w.get('.relative > div');

describe('FileTypePicker display', () => {
  it('shows the description', () => {
    const wrapper = mountPicker({ description: 'Pick types' });

    expect(wrapper.text()).toContain('Pick types');
  });

  it('shows the empty placeholder when enabled', () => {
    const wrapper = mountPicker();

    expect(wrapper.text()).toContain('Select allowed file types');
  });

  // Regression: the combobox input uses focus:outline-none, so the container
  // must show a focus-within ring or keyboard focus is invisible (WCAG 2.4.7).
  it('shows a focus-within ring on the combobox container', () => {
    const wrapper = mountPicker();

    expect(box(wrapper).classes()).toContain('focus-within:ring-2');
  });

  it('shows the disabled hint when disabled', () => {
    const wrapper = mountPicker({ disabled: true });

    expect(wrapper.text()).toContain('Enable downloads to select file types');
  });

  it('renders a chip per selected type', () => {
    const wrapper = mountPicker({ selectedFileTypes: ['png', 'glb'] });

    expect(wrapper.text()).toContain('png');
  });
});

describe('FileTypePicker dropdown', () => {
  it('opens the list on click', async () => {
    const wrapper = mountPicker();

    await box(wrapper).trigger('click');

    expect(wrapper.findComponent(listStub).exists()).toBe(true);
  });

  it('does not open the list when disabled', async () => {
    const wrapper = mountPicker({ disabled: true });

    await box(wrapper).trigger('click');

    expect(wrapper.findComponent(listStub).exists()).toBe(false);
  });
});

describe('FileTypePicker selection', () => {
  it('adds a type via the list and emits', async () => {
    const wrapper = mountPicker();
    await box(wrapper).trigger('click');

    await wrapper.findComponent(listStub).vm.$emit('toggle-selection', 'png');

    expect(wrapper.emitted('setSelectedFileTypes')?.[0]).toEqual([['png']]);
  });

  it('removes an already-selected type via the list', async () => {
    const wrapper = mountPicker({ selectedFileTypes: ['png'] });
    await box(wrapper).trigger('click');

    await wrapper.findComponent(listStub).vm.$emit('toggle-selection', 'png');

    expect(wrapper.emitted('setSelectedFileTypes')?.[0]).toEqual([[]]);
  });

  it('removes a chip via its × button', async () => {
    const wrapper = mountPicker({ selectedFileTypes: ['png', 'glb'] });

    const remove = wrapper.findAll('span').find((s) => s.text() === '×')!;
    await remove.trigger('click');

    expect(wrapper.emitted('setSelectedFileTypes')?.[0]).toEqual([['glb']]);
  });

  it('exposes each chip remove as a labelled button', () => {
    const wrapper = mountPicker({ selectedFileTypes: ['png'] });

    expect(
      wrapper.get('button[aria-label="Remove png"]').element.tagName
    ).toBe('BUTTON');
  });

  describe('keyboard accessibility', () => {
    const trigger = (w: ReturnType<typeof mount>) =>
      w.get('[data-testid="file-type-picker"]');

    it('exposes the trigger as a combobox', () => {
      const wrapper = mountPicker();

      expect({
        role: trigger(wrapper).attributes('role'),
        expanded: trigger(wrapper).attributes('aria-expanded'),
      }).toEqual({ role: 'combobox', expanded: 'false' });
    });

    it('opens the list from the trigger with ArrowDown', async () => {
      const wrapper = mountPicker();

      await trigger(wrapper).trigger('keydown', { key: 'ArrowDown' });

      expect(wrapper.findComponent(listStub).exists()).toBe(true);
    });

    it('reflects the open state on aria-expanded', async () => {
      const wrapper = mountPicker();

      await trigger(wrapper).trigger('keydown', { key: 'Enter' });

      expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
    });
  });

  it('syncs selection when the prop changes', async () => {
    const wrapper = mountPicker({ selectedFileTypes: ['png'] });

    await wrapper.setProps({ selectedFileTypes: ['glb', 'stl'] });

    expect(wrapper.text()).toContain('stl');
  });
});

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import LightboxInfoPanel from '@/components/discussion/detail/LightboxInfoPanel.vue';

const image = (overrides: Record<string, unknown> = {}) => ({
  id: 'img1',
  caption: 'A nice cat',
  Uploader: { username: 'alice' },
  ...overrides,
});

const mountPanel = (props: Record<string, unknown> = {}) =>
  mount(LightboxInfoPanel, {
    props: {
      currentImage: image(),
      isEditing: false,
      editingCaption: '',
      isLoggedInAuthor: false,
      panelOnSide: false,
      ...props,
    },
    global: {
      stubs: {
        XmarkIcon: true,
        PencilIcon: true,
        TextEditor: { name: 'TextEditor', emits: ['update'], template: '<div class="editor" />' },
        SaveButton: { name: 'SaveButton', emits: ['click'], template: '<button class="save" @click="$emit(\'click\', $event)" />' },
        CancelButton: { name: 'CancelButton', emits: ['click'], template: '<button class="cancel" @click="$emit(\'click\', $event)" />' },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

describe('LightboxInfoPanel display', () => {
  it('shows the caption', () => {
    const wrapper = mountPanel();

    expect(wrapper.text()).toContain('A nice cat');
  });

  it('shows a More Details link when there is an uploader', () => {
    const wrapper = mountPanel();

    expect(wrapper.text()).toContain('More Details');
  });

  it('emits close-panel from the close button', async () => {
    const wrapper = mountPanel();

    await wrapper.find('button[title="Close panel"]').trigger('click');

    expect(wrapper.emitted('close-panel')).toBeTruthy();
  });
});

describe('LightboxInfoPanel no caption', () => {
  it('shows a no-caption message for non-authors', () => {
    const wrapper = mountPanel({ currentImage: image({ caption: '' }) });

    expect(wrapper.text()).toContain('No caption available');
  });

  it('offers to add a caption for the author', () => {
    const wrapper = mountPanel({
      currentImage: image({ caption: '' }),
      isLoggedInAuthor: true,
    });

    expect(wrapper.text()).toContain('Add a caption');
  });
});

describe('LightboxInfoPanel editing', () => {
  it('shows the caption editor when editing', () => {
    const wrapper = mountPanel({ isEditing: true });

    expect(wrapper.find('.editor').exists()).toBe(true);
  });

  it('emits update-caption from the editor', async () => {
    const wrapper = mountPanel({ isEditing: true });

    await wrapper.getComponent({ name: 'TextEditor' }).vm.$emit('update', 'new caption');

    expect(wrapper.emitted('update-caption')?.[0]).toEqual(['new caption']);
  });

  it('emits save-caption from the save button', async () => {
    const wrapper = mountPanel({ isEditing: true });

    await wrapper.find('.save').trigger('click');

    expect(wrapper.emitted('save-caption')).toBeTruthy();
  });

  it('emits cancel-editing from the cancel button', async () => {
    const wrapper = mountPanel({ isEditing: true });

    await wrapper.find('.cancel').trigger('click');

    expect(wrapper.emitted('cancel-editing')).toBeTruthy();
  });

  it('emits start-editing from the edit button', async () => {
    const wrapper = mountPanel({ isLoggedInAuthor: true });

    await wrapper.find('[title="Edit caption"]').trigger('click');

    expect(wrapper.emitted('start-editing')).toBeTruthy();
  });
});

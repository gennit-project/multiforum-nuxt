import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import TextEditorFullScreen from '@/components/text-editor/TextEditorFullScreen.vue';

const mountEditor = (props: Record<string, unknown> = {}) =>
  mount(TextEditorFullScreen, {
    props: {
      text: 'hello',
      placeholder: 'Type here',
      testId: 'editor',
      accessibleLabel: 'Editor',
      allowImageUpload: true,
      fieldName: 'body',
      showEmojiPicker: false,
      emojiPickerPosition: { top: '0', left: '0' },
      ...props,
    },
    global: {
      stubs: {
        TextEditorToolbar: { name: 'TextEditorToolbar', emits: ['format', 'toggle-emoji'], template: '<div class="toolbar" />' },
        AddImage: { name: 'AddImage', props: ['fieldName', 'label'], emits: ['file-change'], template: '<div class="add-image" />' },
        EmojiPickerWrapper: { name: 'EmojiPickerWrapper', props: ['position'], emits: ['emoji-click', 'close'], template: '<div class="emoji" />' },
        MarkdownRenderer: { name: 'MarkdownRenderer', props: ['text'], template: '<div class="preview">{{ text }}</div>' },
      },
    },
  });

const textarea = (w: ReturnType<typeof mount>) => w.find('textarea');

describe('TextEditorFullScreen layout', () => {
  it('renders the full-screen header', () => {
    const wrapper = mountEditor();

    expect(wrapper.text()).toContain('Full Screen Editor');
  });

  it('shows the text in the editor', () => {
    const wrapper = mountEditor();

    expect((textarea(wrapper).element as HTMLTextAreaElement).value).toBe('hello');
  });

  it('renders the preview with the text', () => {
    const wrapper = mountEditor();

    expect(wrapper.find('.preview').text()).toBe('hello');
  });

  it('links to the markdown guide', () => {
    const wrapper = mountEditor();

    expect(wrapper.find('a[href*="markdownguide"]').exists()).toBe(true);
  });
});

describe('TextEditorFullScreen emits', () => {
  it('emits exit from the close button', async () => {
    const wrapper = mountEditor();

    await wrapper.find('button[aria-label="Exit full screen"]').trigger('click');

    expect(wrapper.emitted('exit')).toBeTruthy();
  });

  it.each(['input', 'click', 'keyup', 'drop'])(
    'emits %s from the textarea',
    async (evt) => {
      const wrapper = mountEditor();

      await textarea(wrapper).trigger(evt);

      expect(wrapper.emitted(evt)).toBeTruthy();
    }
  );

  it('re-emits format from the toolbar', async () => {
    const wrapper = mountEditor();

    await wrapper.getComponent({ name: 'TextEditorToolbar' }).vm.$emit('format', 'bold');

    expect(wrapper.emitted('format')?.[0]).toEqual(['bold']);
  });

  it('re-emits toggle-emoji from the toolbar', async () => {
    const wrapper = mountEditor();

    await wrapper.getComponent({ name: 'TextEditorToolbar' }).vm.$emit('toggle-emoji', {});

    expect(wrapper.emitted('toggle-emoji')).toBeTruthy();
  });
});

describe('TextEditorFullScreen image upload', () => {
  it('shows the image uploader when enabled', () => {
    const wrapper = mountEditor();

    expect(wrapper.find('.add-image').exists()).toBe(true);
  });

  it('hides the image uploader when disabled', () => {
    const wrapper = mountEditor({ allowImageUpload: false });

    expect(wrapper.find('.add-image').exists()).toBe(false);
  });

  it('re-emits file-change from the uploader', async () => {
    const wrapper = mountEditor();

    await wrapper.getComponent({ name: 'AddImage' }).vm.$emit('file-change', { fieldName: 'body' });

    expect(wrapper.emitted('file-change')).toBeTruthy();
  });
});

describe('TextEditorFullScreen emoji picker', () => {
  it('hides the emoji picker by default', () => {
    const wrapper = mountEditor();

    expect(wrapper.find('.emoji').exists()).toBe(false);
  });

  it('shows the emoji picker when enabled', async () => {
    const wrapper = mountEditor({ showEmojiPicker: true });
    await flushPromises();

    expect(wrapper.find('.emoji').exists()).toBe(true);
  });

  it('re-emits emoji-click', async () => {
    const wrapper = mountEditor({ showEmojiPicker: true });
    await flushPromises();

    await wrapper.getComponent({ name: 'EmojiPickerWrapper' }).vm.$emit('emoji-click', { emoji: 'x' });

    expect(wrapper.emitted('emoji-click')).toBeTruthy();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

import TextEditor from '@/components/TextEditor.vue';

// Vuetify's useDisplay needs the Vuetify plugin context, which we don't install
// in unit tests. The component only reads `width`, so stub it to a desktop width.
vi.mock('vuetify', () => ({
  useDisplay: () => ({ width: ref(1024) }),
}));

// useImageUpload talks to GraphQL/object storage. It has its own unit tests; here
// we stub it so we can drive TextEditor's upload *orchestration* deterministically.
// The placeholder markdown intentionally embeds "<placeholderText> (id:<id>)" so the
// component's "placeholder still present" lookup succeeds and hits the main branch.
const { uploadFileMock } = vi.hoisted(() => ({ uploadFileMock: vi.fn() }));
vi.mock('@/composables/useImageUpload', () => ({
  useImageUpload: () => ({
    uploadFile: uploadFileMock,
    validateFileSize: (file: File) => ({
      valid: file.size <= 5 * 1024 * 1024,
      message: 'File too large',
    }),
    createUploadPlaceholder: (file: File, id: string) => ({
      markdown: `![uploading ${file.name} (id:${id})]()`,
      placeholderText: `uploading ${file.name}`,
    }),
    createImageMarkdown: (name: string, link: string) => `![${name}](${link})`,
    createErrorMarkdown: (name: string, err: string) => `[upload error: ${name} ${err}]`,
    createPlaceholderRegex: (placeholderText: string, id: string) =>
      new RegExp(`!\\[${placeholderText} \\(id:${id}\\)\\]\\(\\)`),
    createSignedStorageUrlError: ref(null),
  }),
}));

// Mount the REAL component (not a mock). Child components are stubbed so we
// exercise TextEditor's own script logic and template branches, while the
// native <textarea> stays live for interaction.
const mountEditor = (props: Record<string, unknown> = {}) =>
  mount(TextEditor, {
    props,
    global: {
      stubs: {
        AddImage: true,
        ErrorBanner: true,
        CharCounter: true,
        TextEditorToolbar: true,
        BotSuggestionsPopover: true,
        ModSuggestionsPopover: true,
        TextEditorFullScreen: true,
        EmojiPickerWrapper: true,
        MarkdownRenderer: true,
      },
    },
  });

describe('TextEditor (real mount)', () => {
  it('renders the textarea seeded with initialValue', () => {
    const wrapper = mountEditor({ initialValue: 'hello world' });

    expect(
      (wrapper.get('[data-testid="texteditor-textarea"]').element as HTMLTextAreaElement)
        .value
    ).toBe('hello world');
  });

  it('applies a custom testId to the textarea', () => {
    const wrapper = mountEditor({ testId: 'my-editor' });

    expect(wrapper.find('[data-testid="my-editor"]').exists()).toBe(true);
  });

  it('emits update with the new value when the user types', async () => {
    const wrapper = mountEditor();

    await wrapper.get('textarea').setValue('typed text');

    expect(wrapper.emitted('update')?.at(-1)).toEqual(['typed text']);
  });

  describe('accessibleLabel', () => {
    it('prefers the ariaLabel prop', () => {
      const wrapper = mountEditor({ ariaLabel: 'Comment body' });

      expect(wrapper.get('textarea').attributes('aria-label')).toBe(
        'Comment body'
      );
    });

    it('falls back to the placeholder when no ariaLabel is given', () => {
      const wrapper = mountEditor({ placeholder: 'Say something' });

      expect(wrapper.get('textarea').attributes('aria-label')).toBe(
        'Say something'
      );
    });
  });

  describe('write / preview tabs', () => {
    it('shows the textarea on the Write tab by default', () => {
      const wrapper = mountEditor();

      expect(wrapper.find('textarea').exists()).toBe(true);
    });

    it('switches to the rendered preview when the Preview tab is clicked', async () => {
      const wrapper = mountEditor({ initialValue: '# Title' });

      const previewTab = wrapper
        .findAll('button')
        .find((b) => b.text() === 'Preview');
      await previewTab?.trigger('click');

      expect(wrapper.find('textarea').exists()).toBe(false);
    });
  });

  describe('character counter', () => {
    it('is hidden by default', () => {
      const wrapper = mountEditor();

      expect(wrapper.findComponent({ name: 'CharCounter' }).exists()).toBe(
        false
      );
    });

    it('is shown when showCharCounter is true', () => {
      const wrapper = mountEditor({ showCharCounter: true });

      expect(wrapper.findComponent({ name: 'CharCounter' }).exists()).toBe(
        true
      );
    });
  });

  describe('image upload affordance', () => {
    it('renders the AddImage control by default', () => {
      const wrapper = mountEditor();

      expect(wrapper.findComponent({ name: 'AddImage' }).exists()).toBe(true);
    });

    it('hides the AddImage control when allowImageUpload is false', () => {
      const wrapper = mountEditor({ allowImageUpload: false });

      expect(wrapper.findComponent({ name: 'AddImage' }).exists()).toBe(false);
    });
  });

  describe('formatting toolbar', () => {
    it('emits an update after the toolbar requests a format', async () => {
      const wrapper = mountEditor({ initialValue: 'plain' });

      await wrapper
        .findComponent({ name: 'TextEditorToolbar' })
        .vm.$emit('format', 'bold');

      expect(wrapper.emitted('update')).toBeTruthy();
    });
  });
});

describe('TextEditor image upload', () => {
  const emitFileChange = async (
    wrapper: ReturnType<typeof mount>,
    file: File
  ) => {
    wrapper.findComponent({ name: 'AddImage' }).vm.$emit('file-change', {
      event: { target: { files: [file] } },
      fieldName: '',
    });
    await flushPromises();
  };

  const mountEditor = () =>
    mount(TextEditor, {
      global: {
        stubs: {
          AddImage: true,
          ErrorBanner: true,
          CharCounter: true,
          TextEditorToolbar: true,
          BotSuggestionsPopover: true,
          ModSuggestionsPopover: true,
          TextEditorFullScreen: true,
          EmojiPickerWrapper: true,
          MarkdownRenderer: true,
        },
      },
    });

  beforeEach(() => {
    uploadFileMock.mockReset();
    vi.stubGlobal('alert', vi.fn());
  });

  it('replaces the placeholder with the uploaded image markdown on success', async () => {
    uploadFileMock.mockResolvedValue({
      success: true,
      embeddedLink: 'https://cdn.example.com/pic.png',
    });
    const wrapper = mountEditor();

    await emitFileChange(wrapper, new File(['x'], 'pic.png'));

    expect(wrapper.emitted('update')?.at(-1)?.[0]).toContain(
      'https://cdn.example.com/pic.png'
    );
  });

  it('inserts error markdown when the upload reports failure', async () => {
    uploadFileMock.mockResolvedValue({ success: false, error: 'denied' });
    const wrapper = mountEditor();

    await emitFileChange(wrapper, new File(['x'], 'pic.png'));

    expect(wrapper.emitted('update')?.at(-1)?.[0]).toContain('upload error');
  });

  it('inserts error markdown when the upload throws', async () => {
    uploadFileMock.mockRejectedValue(new Error('boom'));
    const wrapper = mountEditor();

    await emitFileChange(wrapper, new File(['x'], 'pic.png'));

    expect(wrapper.emitted('update')?.at(-1)?.[0]).toContain('boom');
  });

  it('alerts and skips upload when the file is too large', async () => {
    const wrapper = mountEditor();
    const bigFile = new File(['x'.repeat(6 * 1024 * 1024)], 'big.png');

    await emitFileChange(wrapper, bigFile);

    expect(uploadFileMock).not.toHaveBeenCalled();
  });
});

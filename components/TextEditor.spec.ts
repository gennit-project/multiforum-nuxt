import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import TextEditor from '@/components/TextEditor.vue';
import {
  formatText,
  formatBold,
  formatItalic,
  formatUnderline,
  formatHeader1,
  formatHeader2,
  formatHeader3,
  formatQuote,
  insertEmoji,
  calculateRemainingChars,
} from '@/utils/textFormatting';
import { isFileSizeValid } from '@/utils/index';

// --- Mounted-component setup (the existing tests above only exercise the
// extracted utils; these mount the real TextEditor textarea editor) ---
vi.mock('vuetify', () => ({ useDisplay: () => ({ width: ref(1024) }) }));
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: vi.fn(),
    onDone: vi.fn(),
    onError: vi.fn(),
    loading: ref(false),
    error: ref(null),
  }),
}));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

// Mock the image-upload composable so the upload flow (placeholder insertion,
// success/failure replacement, size validation) is drivable without Apollo.
const { uploadFileMock, validateFileSizeMock } = vi.hoisted(() => ({
  uploadFileMock: vi.fn(),
  validateFileSizeMock: vi.fn(() => ({ valid: true, message: '' })),
}));
vi.mock('@/composables/useImageUpload', () => ({
  useImageUpload: () => ({
    uploadFile: uploadFileMock,
    validateFileSize: validateFileSizeMock,
    createUploadPlaceholder: (file: File, id: string) => ({
      markdown: `![uploading ${file.name}](placeholder-${id})`,
      placeholderText: `uploading ${file.name}`,
    }),
    createImageMarkdown: (name: string, link: string) => `![${name}](${link})`,
    createErrorMarkdown: (name: string, err: string) =>
      `[upload failed: ${name} — ${err}]`,
    createPlaceholderRegex: (_text: string, id: string) =>
      new RegExp(`!\\[uploading [^\\]]+\\]\\(placeholder-${id}\\)`),
    createSignedStorageUrlError: ref(null),
  }),
}));

const fileChange = (file: File) => ({
  event: { target: { files: [file] } } as unknown as Event & {
    target: HTMLInputElement | null;
  },
  fieldName: '',
});

const editorStubs = {
  TextEditorToolbar: {
    name: 'TextEditorToolbar',
    emits: ['format', 'toggle-emoji', 'toggle-fullscreen'],
    template: '<div class="toolbar-stub" />',
  },
  AddImage: { name: 'AddImage', emits: ['file-change'], template: '<div />' },
  BotSuggestionsPopover: true,
  ModSuggestionsPopover: true,
  CharCounter: {
    name: 'CharCounter',
    props: ['current', 'max'],
    template: '<div class="char-counter">{{ current }}/{{ max }}</div>',
  },
  EmojiPickerWrapper: true,
  MarkdownRenderer: {
    name: 'MarkdownRenderer',
    props: ['text'],
    template: '<div class="markdown-preview">{{ text }}</div>',
  },
  TextEditorFullScreen: true,
  // headlessui tab primitives — render as transparent click targets.
  Tab: { template: '<button><slot /></button>' },
  TabGroup: { template: '<div><slot /></div>' },
  TabList: { template: '<div><slot /></div>' },
};

const mountEditor = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(TextEditor, {
    props: { disableAutoFocus: true, ...props },
    global: { stubs: editorStubs },
  });

const textarea = (wrapper: ReturnType<typeof mountEditor>) =>
  wrapper.get('[data-testid="texteditor-textarea"]');

// Test the text formatting functions
describe('TextEditor formatting functions', () => {
  it('formats text as bold correctly', () => {
    expect(formatBold({ text: 'sample text' })).toBe('**sample text**');
    expect(formatText({ text: 'sample text', format: 'bold' })).toBe(
      '**sample text**'
    );
  });

  it('formats text as italic correctly', () => {
    expect(formatItalic({ text: 'sample text' })).toBe('*sample text*');
    expect(formatText({ text: 'sample text', format: 'italic' })).toBe(
      '*sample text*'
    );
  });

  it('formats text as underline correctly', () => {
    expect(formatUnderline({ text: 'sample text' })).toBe('<u>sample text</u>');
    expect(formatText({ text: 'sample text', format: 'underline' })).toBe(
      '<u>sample text</u>'
    );
  });

  it('formats text as header 1 correctly', () => {
    expect(formatHeader1({ text: 'sample text' })).toBe('# sample text');
    expect(formatText({ text: 'sample text', format: 'header1' })).toBe(
      '# sample text'
    );
  });

  it('formats text as header 2 correctly', () => {
    expect(formatHeader2({ text: 'sample text' })).toBe('## sample text');
    expect(formatText({ text: 'sample text', format: 'header2' })).toBe(
      '## sample text'
    );
  });

  it('formats text as header 3 correctly', () => {
    expect(formatHeader3({ text: 'sample text' })).toBe('### sample text');
    expect(formatText({ text: 'sample text', format: 'header3' })).toBe(
      '### sample text'
    );
  });

  it('formats text as a quote correctly', () => {
    const input = 'line 1\nline 2';
    const expected = '> line 1\n> line 2';
    expect(formatQuote({ text: input })).toBe(expected);
    expect(formatText({ text: input, format: 'quote' })).toBe(expected);
  });

  it('handles empty text correctly', () => {
    expect(formatBold({ text: '' })).toBe('****');
    expect(formatItalic({ text: '' })).toBe('**');
    expect(formatHeader1({ text: '' })).toBe('# ');
  });

  it('handles multi-line text correctly', () => {
    const multilineText = 'First line\nSecond line\nThird line';

    // Bold should wrap the entire text
    expect(formatBold({ text: multilineText })).toBe(
      '**First line\nSecond line\nThird line**'
    );

    // Quote should prefix each line
    expect(formatQuote({ text: multilineText })).toBe(
      '> First line\n> Second line\n> Third line'
    );
  });
});

// Test the character counter logic
describe('CharCounter', () => {
  it('calculates characters remaining correctly', () => {
    expect(calculateRemainingChars({ current: 0, max: 500 })).toBe(500);
    expect(calculateRemainingChars({ current: 100, max: 500 })).toBe(400);
    expect(calculateRemainingChars({ current: 500, max: 500 })).toBe(0);
    expect(calculateRemainingChars({ current: 600, max: 500 })).toBe(-100);
  });
});

// Test the file size validation utility
describe('Image Upload Validation', () => {
  it('validates file size correctly', () => {
    // Mock small file (1MB)
    const smallFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(smallFile, 'size', { value: 1 * 1024 * 1024 });
    expect(isFileSizeValid({ file: smallFile }).valid).toBe(true);

    // Mock large file (10MB)
    const largeFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 10 * 1024 * 1024 });
    expect(isFileSizeValid({ file: largeFile }).valid).toBe(false);
  });

  it('returns informative error messages', () => {
    const largeFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 10 * 1024 * 1024 });
    const result = isFileSizeValid({ file: largeFile });
    expect(result.valid).toBe(false);
    expect(result.message).toContain('must be less than');
  });
});

// Test emoji insertion logic
describe('Emoji Insertion', () => {
  it('inserts emoji at cursor position', () => {
    expect(insertEmoji({ text: 'Hello world', position: 5, emoji: '👋' })).toBe(
      'Hello👋 world'
    );
    expect(insertEmoji({ text: '', position: 0, emoji: '😊' })).toBe('😊');
  });

  it('handles emoji insertion at start and end of text', () => {
    expect(insertEmoji({ text: 'Hello world', position: 0, emoji: '👋' })).toBe(
      '👋Hello world'
    );
    expect(
      insertEmoji({ text: 'Hello world', position: 11, emoji: '👋' })
    ).toBe('Hello world👋');
  });

  it('maintains cursor position after emoji insertion', () => {
    const originalText = 'Hello world';
    const emoji = '👋';
    const position = 5;

    const result = insertEmoji({ text: originalText, position, emoji });

    // Function should not modify the original text directly
    expect(originalText).toBe('Hello world');

    // New text should have emoji inserted
    expect(result).toBe('Hello👋 world');

    // In real usage, cursor position would be updated to after the emoji
    // Note: Emoji length in JavaScript is often counted as more than 1 character
    // because they're represented by multiple UTF-16 code units
    const newCursorPosition = position + emoji.length;
    expect(newCursorPosition).toBe(7); // Emoji "👋" has a length of 2 in JavaScript
  });
});

// Mount the real component and drive its textarea/toolbar/tab handlers.
describe('TextEditor (mounted)', () => {
  it('renders the initial value in the textarea', () => {
    const wrapper = mountEditor({ initialValue: 'hello world' });
    expect(
      (textarea(wrapper).element as HTMLTextAreaElement).value
    ).toBe('hello world');
  });

  it('emits update as the user types', async () => {
    const wrapper = mountEditor();
    await textarea(wrapper).setValue('typed text');
    expect(wrapper.emitted('update')?.at(-1)).toEqual(['typed text']);
  });

  it('updates the cursor index on keyup without error', async () => {
    const wrapper = mountEditor({ initialValue: 'abc' });
    await textarea(wrapper).trigger('keyup');
    await textarea(wrapper).trigger('click');
    expect(textarea(wrapper).exists()).toBe(true);
  });

  it('ignores keydown when no autocomplete is active', async () => {
    const wrapper = mountEditor();
    await textarea(wrapper).trigger('keydown', { key: 'Enter' });
    // No autocomplete suggestions, so Enter is not intercepted and nothing emits.
    expect(wrapper.emitted('update')).toBeUndefined();
  });

  it('shows the character counter only when enabled', () => {
    expect(mountEditor({ showCharCounter: true }).find('.char-counter').exists()).toBe(
      true
    );
    expect(mountEditor().find('.char-counter').exists()).toBe(false);
  });

  it('renders a markdown preview when the Preview tab is selected', async () => {
    const wrapper = mountEditor({ initialValue: 'preview me' });
    expect(wrapper.find('.markdown-preview').exists()).toBe(false);

    const previewTab = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Preview'));
    await previewTab!.trigger('click');

    expect(wrapper.find('.markdown-preview').text()).toContain('preview me');
  });

  it('applies a toolbar format command and emits the updated text', async () => {
    const wrapper = mountEditor({ initialValue: 'bold' });
    await wrapper
      .findComponent({ name: 'TextEditorToolbar' })
      .vm.$emit('format', 'bold');
    expect(wrapper.emitted('update')).toBeTruthy();
    expect(String(wrapper.emitted('update')?.at(-1)?.[0])).toContain('**');
  });
});

describe('TextEditor (image upload)', () => {
  beforeEach(() => {
    uploadFileMock.mockReset();
    validateFileSizeMock.mockReset().mockReturnValue({ valid: true, message: '' });
  });

  const pngFile = () => new File(['x'], 'pic.png', { type: 'image/png' });

  it('replaces the placeholder with the uploaded image markdown on success', async () => {
    uploadFileMock.mockResolvedValue({
      success: true,
      embeddedLink: 'https://cdn.example.com/pic.png',
    });
    const wrapper = mountEditor({ initialValue: '' });
    await wrapper
      .findComponent({ name: 'AddImage' })
      .vm.$emit('file-change', fileChange(pngFile()));
    await flushPromises();

    const last = String(wrapper.emitted('update')?.at(-1)?.[0]);
    expect(last).toContain('https://cdn.example.com/pic.png');
  });

  it('inserts error markdown when the upload fails', async () => {
    uploadFileMock.mockResolvedValue({ success: false, error: 'server said no' });
    const wrapper = mountEditor({ initialValue: '' });
    await wrapper
      .findComponent({ name: 'AddImage' })
      .vm.$emit('file-change', fileChange(pngFile()));
    await flushPromises();

    const last = String(wrapper.emitted('update')?.at(-1)?.[0]);
    expect(last).toContain('upload failed');
  });

  it('rejects an oversized file before uploading', async () => {
    validateFileSizeMock.mockReturnValue({ valid: false, message: 'too big' });
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    const wrapper = mountEditor({ initialValue: '' });
    await wrapper
      .findComponent({ name: 'AddImage' })
      .vm.$emit('file-change', fileChange(pngFile()));
    await flushPromises();

    expect(alertSpy).toHaveBeenCalledWith('too big');
    expect(uploadFileMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

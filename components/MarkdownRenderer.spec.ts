import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import type * as CodeHighlighter from '@/utils/codeHighlighter';

const h = vi.hoisted(() => ({
  renderMarkdown: vi.fn(),
  loadCodeHighlighter: vi.fn(),
}));

vi.mock('@/composables/useMarkdownRenderer', () => ({
  useMarkdownRenderer: () => ({ renderMarkdown: h.renderMarkdown }),
}));

// Keep the real fence detection; only the dynamic import is replaced.
vi.mock('@/utils/codeHighlighter', async (importOriginal) => ({
  ...(await importOriginal<typeof CodeHighlighter>()),
  loadCodeHighlighter: h.loadCodeHighlighter,
}));

const mountRenderer = (props: Record<string, unknown> = {}, slots = {}) =>
  mount(MarkdownRenderer, { props: { text: 'hello', ...props }, slots });

beforeEach(() => {
  vi.clearAllMocks();
  h.renderMarkdown.mockImplementation((text: string) => `<p>${text}</p>`);
  h.loadCodeHighlighter.mockResolvedValue({});
});

describe('MarkdownRenderer rendering', () => {
  it('renders the markdown HTML from the composable', () => {
    const wrapper = mountRenderer({ text: 'hi there' });

    expect(wrapper.get('.markdown-body').html()).toContain('<p>hi there</p>');
  });

  it('passes allowImages through to the renderer', () => {
    mountRenderer({ text: 'x', allowImages: false });

    expect(h.renderMarkdown).toHaveBeenCalledWith('x', { allowImages: false });
  });
});

describe('MarkdownRenderer font size', () => {
  it.each([
    ['small', 'font-size-small'],
    ['medium', 'font-size-medium'],
    ['large', 'font-size-large'],
  ])('applies the %s font size class', (fontSize, cls) => {
    const wrapper = mountRenderer({ fontSize });

    expect(wrapper.get('.markdown-body').classes()).toContain(cls);
  });
});

describe('MarkdownRenderer layout', () => {
  it('sets the image max height CSS variable', () => {
    const wrapper = mountRenderer({ imageMaxHeight: '500px' });

    expect(wrapper.get('.markdown-container').attributes('style')).toContain(
      '--image-max-height: 500px'
    );
  });

  it('renders default slot content', () => {
    const wrapper = mountRenderer({}, { default: '<span>extra</span>' });

    expect(wrapper.find('.inline-slot').exists()).toBe(true);
  });

  it('omits the slot wrapper when no slot content is provided', () => {
    const wrapper = mountRenderer();

    expect(wrapper.find('.inline-slot').exists()).toBe(false);
  });
});

describe('MarkdownRenderer code highlighting', () => {
  it('loads the highlighter when the text has a fenced code block with a language', () => {
    mountRenderer({ text: '```js\nconst x = 1;\n```' });

    expect(h.loadCodeHighlighter).toHaveBeenCalledTimes(1);
  });

  it('does not load the highlighter for text without highlightable code', () => {
    mountRenderer({ text: 'plain text with `inline code`' });

    expect(h.loadCodeHighlighter).not.toHaveBeenCalled();
  });

  it('loads the highlighter when the text changes to include code', async () => {
    const wrapper = mountRenderer({ text: 'plain' });
    await wrapper.setProps({ text: '```ts\nlet a = 1;\n```' });

    expect(h.loadCodeHighlighter).toHaveBeenCalledTimes(1);
  });

  it('still renders the markdown when the highlighter fails to load', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    h.loadCodeHighlighter.mockRejectedValue(new Error('chunk failed'));
    const wrapper = mountRenderer({ text: '```js\nx\n```' });
    await flushPromises();

    expect(wrapper.get('.markdown-body').html()).toContain('<p>```js');
  });
});

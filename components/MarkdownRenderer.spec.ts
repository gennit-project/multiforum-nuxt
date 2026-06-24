import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import MarkdownRenderer from '@/components/MarkdownRenderer.vue';

const h = vi.hoisted(() => ({ renderMarkdown: vi.fn() }));

vi.mock('@/composables/useMarkdownRenderer', () => ({
  useMarkdownRenderer: () => ({ renderMarkdown: h.renderMarkdown }),
}));

const mountRenderer = (props: Record<string, unknown> = {}, slots = {}) =>
  mount(MarkdownRenderer, { props: { text: 'hello', ...props }, slots });

beforeEach(() => {
  vi.clearAllMocks();
  h.renderMarkdown.mockImplementation((text: string) => `<p>${text}</p>`);
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

import { describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createMockRoute, createMockRouter } from '@/tests/utils/mockRouter';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';

import MarkdownPreview from '@/components/MarkdownPreview.vue';

// uiStore (pulled in by MarkdownPreview) imports useCookie/useRoute/useRouter
// from nuxt/app at module load.
vi.mock('nuxt/app', () => ({
  useCookie: () => ({ value: 'dark' }),
  useRoute: () => createMockRoute(),
  useRouter: () => createMockRouter(),
}));

const mountPreview = (props: Record<string, unknown>) =>
  mountWithDefaults(MarkdownPreview, {
    props,
    global: { stubs: { MarkdownRenderer: true, VueEasyLightbox: true } },
  });

const renderedText = (wrapper: ReturnType<typeof mountPreview>) =>
  wrapper.findComponent(MarkdownRenderer).props('text') as string;

describe('MarkdownPreview', () => {
  it('passes the text through to the renderer', () => {
    const wrapper = mountPreview({ text: 'just words' });
    expect(renderedText(wrapper)).toContain('just words');
  });

  it('auto-links bare URLs in the rendered text', () => {
    const wrapper = mountPreview({ text: 'see https://a.com/x here' });
    expect(renderedText(wrapper)).toContain(
      '[https://a.com/x](https://a.com/x)'
    );
  });

  it('truncates to the word limit when "show more" is enabled', () => {
    const wrapper = mountPreview({
      text: 'one two three four five',
      wordLimit: 3,
      showShowMore: true,
    });
    // Truncated text keeps the first words and drops the rest.
    expect(renderedText(wrapper)).not.toContain('five');
  });
});

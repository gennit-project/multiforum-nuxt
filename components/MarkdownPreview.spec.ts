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

// Stub WarningModal so we can read its `open` prop and emit its events without
// pulling in the real modal (which is auto-imported in the app, not here).
const WarningModalStub = {
  name: 'WarningModal',
  props: ['open', 'body', 'title'],
  emits: ['close', 'primary-button-click'],
  template: '<div data-testid="warning-modal-stub" />',
};

const mountPreview = (props: Record<string, unknown>) =>
  mountWithDefaults(MarkdownPreview, {
    props,
    global: {
      stubs: {
        MarkdownRenderer: true,
        VueEasyLightbox: true,
        WarningModal: WarningModalStub,
      },
    },
  });

const warningModal = (wrapper: ReturnType<typeof mountPreview>) =>
  wrapper.findComponent(WarningModalStub);

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

  describe('show more / show less', () => {
    const longText = 'one two three four five six';

    it('renders a "Show More" button when the text exceeds the word limit', () => {
      const wrapper = mountPreview({
        text: longText,
        wordLimit: 3,
        showShowMore: true,
      });
      const button = wrapper.get('button');
      expect(button.text()).toBe('Show More');
    });

    it('reveals the full text and flips the label when toggled', async () => {
      const wrapper = mountPreview({
        text: longText,
        wordLimit: 3,
        showShowMore: true,
      });
      expect(renderedText(wrapper)).not.toContain('six');

      await wrapper.get('button').trigger('click');

      expect(renderedText(wrapper)).toContain('six');
      expect(wrapper.get('button').text()).toBe('Show Less');
    });

    it('omits the toggle button when show-more is disabled', () => {
      const wrapper = mountPreview({
        text: longText,
        wordLimit: 3,
        showShowMore: false,
      });
      expect(wrapper.find('button').exists()).toBe(false);
      // With show-more off the full text passes through untruncated.
      expect(renderedText(wrapper)).toContain('six');
    });
  });

  describe('external-link warning', () => {
    // Simulate a click on a rendered anchor by injecting one into the root and
    // letting the event bubble to the container's click handler.
    const clickLink = async (
      wrapper: ReturnType<typeof mountPreview>,
      href: string
    ) => {
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.textContent = 'link';
      wrapper.element.appendChild(anchor);
      anchor.click();
      await wrapper.vm.$nextTick();
    };

    it('opens the warning modal for an external link', async () => {
      const wrapper = mountPreview({ text: 'words' });
      expect(warningModal(wrapper).props('open')).toBe(false);

      await clickLink(wrapper, 'https://external.example.com/path');

      expect(warningModal(wrapper).props('open')).toBe(true);
      expect(warningModal(wrapper).props('body')).toContain(
        'external.example.com'
      );
    });

    it('does not warn for an internal link', async () => {
      const wrapper = mountPreview({ text: 'words' });
      await clickLink(wrapper, `${window.location.origin}/forums/cats`);
      expect(warningModal(wrapper).props('open')).toBe(false);
    });

    it('opens the link in a new tab on confirm and then closes', async () => {
      const openSpy = vi
        .spyOn(window, 'open')
        .mockReturnValue(null);
      const wrapper = mountPreview({ text: 'words' });
      await clickLink(wrapper, 'https://external.example.com/path');

      await warningModal(wrapper).vm.$emit('primary-button-click');
      await wrapper.vm.$nextTick();

      expect(openSpy).toHaveBeenCalledWith(
        'https://external.example.com/path',
        '_blank',
        'noopener,noreferrer'
      );
      expect(warningModal(wrapper).props('open')).toBe(false);
      openSpy.mockRestore();
    });

    it('dismisses the warning modal on close', async () => {
      const wrapper = mountPreview({ text: 'words' });
      await clickLink(wrapper, 'https://external.example.com/path');
      expect(warningModal(wrapper).props('open')).toBe(true);

      await warningModal(wrapper).vm.$emit('close');
      await wrapper.vm.$nextTick();

      expect(warningModal(wrapper).props('open')).toBe(false);
    });
  });
});

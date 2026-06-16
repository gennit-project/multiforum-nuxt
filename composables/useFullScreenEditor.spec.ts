import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, ref, nextTick, type Ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useFullScreenEditor } from './useFullScreenEditor';

type HarnessReturn = ReturnType<typeof useFullScreenEditor>;

const setup = (options: { disableAutoFocus?: boolean } = {}) => {
  const editorRef: Ref<HTMLTextAreaElement | null> = ref(null);
  const disableAutoFocus = ref(options.disableAutoFocus ?? false);
  let api!: HarnessReturn;

  const TestComponent = defineComponent({
    template: '<textarea ref="editorRef"></textarea>',
    setup() {
      api = useFullScreenEditor({ editorRef, disableAutoFocus });
      return { editorRef };
    },
  });

  const wrapper = mount(TestComponent, { attachTo: document.body });
  // Point the editor ref at the actual mounted textarea element.
  editorRef.value = wrapper.find('textarea').element;

  return { wrapper, editorRef, disableAutoFocus, getApi: () => api };
};

describe('useFullScreenEditor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('starts outside full-screen mode', () => {
      const { getApi, wrapper } = setup();
      const result = getApi().isFullScreen.value;
      wrapper.unmount();
      expect(result).toBe(false);
    });
  });

  describe('toggleFullScreen', () => {
    it('enters full-screen mode', () => {
      const { getApi, wrapper } = setup();
      getApi().toggleFullScreen();
      const result = getApi().isFullScreen.value;
      wrapper.unmount();
      expect(result).toBe(true);
    });

    it('forces split mode when entering full-screen', () => {
      const { getApi, wrapper } = setup();
      getApi().showFormatted.value = true;
      getApi().toggleFullScreen();
      const result = getApi().showFormatted.value;
      wrapper.unmount();
      expect(result).toBe(false);
    });

    it('exits full-screen mode on a second toggle', () => {
      const { getApi, wrapper } = setup();
      getApi().toggleFullScreen();
      getApi().toggleFullScreen();
      const result = getApi().isFullScreen.value;
      wrapper.unmount();
      expect(result).toBe(false);
    });

    it('focuses the editor when entering full-screen', async () => {
      const { getApi, editorRef, wrapper } = setup();
      const focusSpy = vi.spyOn(
        editorRef.value as HTMLTextAreaElement,
        'focus'
      );
      getApi().toggleFullScreen();
      await nextTick();
      wrapper.unmount();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('does not focus the editor when auto-focus is disabled', async () => {
      const { getApi, editorRef, wrapper } = setup({ disableAutoFocus: true });
      const focusSpy = vi.spyOn(
        editorRef.value as HTMLTextAreaElement,
        'focus'
      );
      getApi().toggleFullScreen();
      await nextTick();
      wrapper.unmount();
      expect(focusSpy).not.toHaveBeenCalled();
    });
  });

  describe('exitFullScreen', () => {
    it('leaves full-screen mode', () => {
      const { getApi, wrapper } = setup();
      getApi().toggleFullScreen();
      getApi().exitFullScreen();
      const result = getApi().isFullScreen.value;
      wrapper.unmount();
      expect(result).toBe(false);
    });
  });

  describe('escape key handling', () => {
    it('exits full-screen when Escape is pressed', () => {
      const { getApi, wrapper } = setup();
      getApi().toggleFullScreen();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      const result = getApi().isFullScreen.value;
      wrapper.unmount();
      expect(result).toBe(false);
    });

    it('ignores other keys', () => {
      const { getApi, wrapper } = setup();
      getApi().toggleFullScreen();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      const result = getApi().isFullScreen.value;
      wrapper.unmount();
      expect(result).toBe(true);
    });

    it('does nothing on Escape when not in full-screen', () => {
      const { getApi, wrapper } = setup();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      const result = getApi().isFullScreen.value;
      wrapper.unmount();
      expect(result).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('removes the keydown listener on unmount', () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener');
      const { wrapper } = setup();
      wrapper.unmount();
      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});

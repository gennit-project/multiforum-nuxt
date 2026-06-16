import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEmojiPicker } from './useEmojiPicker';

type FakeButton = {
  offsetTop: number;
  offsetHeight: number;
  offsetLeft: number;
  containerWidth: number | null;
};

const makeEvent = (button: Partial<FakeButton> = {}): MouseEvent => {
  const {
    offsetTop = 0,
    offsetHeight = 0,
    offsetLeft = 0,
    containerWidth = null,
  } = button;
  return {
    currentTarget: {
      offsetTop,
      offsetHeight,
      offsetLeft,
      offsetParent:
        containerWidth === null ? null : { clientWidth: containerWidth },
    },
  } as unknown as MouseEvent;
};

const makeTextarea = (value: string, cursor: number): HTMLTextAreaElement => {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.selectionStart = cursor;
  textarea.selectionEnd = cursor;
  document.body.appendChild(textarea);
  return textarea;
};

describe('useEmojiPicker', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('initial state', () => {
    it('starts with the picker hidden', () => {
      const { showEmojiPicker } = useEmojiPicker();
      expect(showEmojiPicker.value).toBe(false);
    });

    it('starts with a zeroed position', () => {
      const { emojiPickerPosition } = useEmojiPicker();
      expect(emojiPickerPosition.value).toEqual({ top: '0px', left: '0px' });
    });
  });

  describe('toggleEmojiPicker', () => {
    it('opens the picker on first toggle', () => {
      const { showEmojiPicker, toggleEmojiPicker } = useEmojiPicker();
      toggleEmojiPicker(makeEvent());
      expect(showEmojiPicker.value).toBe(true);
    });

    it('closes the picker when toggled twice', () => {
      const { showEmojiPicker, toggleEmojiPicker } = useEmojiPicker();
      toggleEmojiPicker(makeEvent());
      toggleEmojiPicker(makeEvent());
      expect(showEmojiPicker.value).toBe(false);
    });

    it('positions the picker below the button', () => {
      const { emojiPickerPosition, toggleEmojiPicker } = useEmojiPicker();
      toggleEmojiPicker(makeEvent({ offsetTop: 100, offsetHeight: 20 }));
      expect(emojiPickerPosition.value.top).toBe('120px');
    });

    it('aligns to the button left edge when there is room', () => {
      const { emojiPickerPosition, toggleEmojiPicker } = useEmojiPicker();
      toggleEmojiPicker(
        makeEvent({ offsetLeft: 10, containerWidth: 1000 })
      );
      expect(emojiPickerPosition.value.left).toBe('10px');
    });

    it('shifts left to avoid overflowing the container right edge', () => {
      const { emojiPickerPosition, toggleEmojiPicker } = useEmojiPicker();
      // container 400, picker width 350: left clamps to 400 - 350 - 16 = 34
      toggleEmojiPicker(
        makeEvent({ offsetLeft: 300, containerWidth: 400 })
      );
      expect(emojiPickerPosition.value.left).toBe('34px');
    });

    it('never positions the picker at a negative left offset', () => {
      const { emojiPickerPosition, toggleEmojiPicker } = useEmojiPicker();
      toggleEmojiPicker(
        makeEvent({ offsetLeft: 50, containerWidth: 100 })
      );
      expect(emojiPickerPosition.value.left).toBe('0px');
    });

    it('falls back to window width when there is no offset parent', () => {
      const { showEmojiPicker, toggleEmojiPicker } = useEmojiPicker();
      // No offsetParent -> uses window.innerWidth; just verify it still toggles
      toggleEmojiPicker(makeEvent({ offsetLeft: 10, containerWidth: null }));
      expect(showEmojiPicker.value).toBe(true);
    });
  });

  describe('closeEmojiPicker', () => {
    it('hides the picker', () => {
      const { showEmojiPicker, toggleEmojiPicker, closeEmojiPicker } =
        useEmojiPicker();
      toggleEmojiPicker(makeEvent());
      closeEmojiPicker();
      expect(showEmojiPicker.value).toBe(false);
    });
  });

  describe('insertEmoji', () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    it('logs an error when the event has no unicode', () => {
      const { insertEmoji } = useEmojiPicker();
      const textarea = makeTextarea('hi', 2);
      insertEmoji({
        event: { unicode: '' },
        textarea,
        onUpdate: vi.fn(),
      });
      expect(errorSpy).toHaveBeenCalled();
    });

    it('does not call onUpdate when the event has no unicode', () => {
      const { insertEmoji } = useEmojiPicker();
      const textarea = makeTextarea('hi', 2);
      const onUpdate = vi.fn();
      insertEmoji({ event: { unicode: '' }, textarea, onUpdate });
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('inserts the emoji at the cursor position', () => {
      const { insertEmoji } = useEmojiPicker();
      const textarea = makeTextarea('ab', 1);
      insertEmoji({
        event: { unicode: '😀' },
        textarea,
        onUpdate: vi.fn(),
      });
      expect(textarea.value).toBe('a😀b');
    });

    it('reports the new text through onUpdate', () => {
      const { insertEmoji } = useEmojiPicker();
      const textarea = makeTextarea('ab', 1);
      const onUpdate = vi.fn();
      insertEmoji({ event: { unicode: '😀' }, textarea, onUpdate });
      expect(onUpdate).toHaveBeenCalledWith('a😀b');
    });

    it('moves the cursor past the inserted emoji', () => {
      const { insertEmoji } = useEmojiPicker();
      const textarea = makeTextarea('ab', 1);
      insertEmoji({
        event: { unicode: '😀' },
        textarea,
        onUpdate: vi.fn(),
      });
      expect(textarea.selectionStart).toBe(1 + '😀'.length);
    });

    it('closes the picker after inserting', () => {
      const { showEmojiPicker, toggleEmojiPicker, insertEmoji } =
        useEmojiPicker();
      toggleEmojiPicker(makeEvent());
      const textarea = makeTextarea('ab', 1);
      insertEmoji({
        event: { unicode: '😀' },
        textarea,
        onUpdate: vi.fn(),
      });
      expect(showEmojiPicker.value).toBe(false);
    });
  });
});

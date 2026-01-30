import { ref } from 'vue';
import { insertEmoji as insertEmojiAtPosition } from '@/utils/textFormatting';

export type EmojiClickEvent = {
  unicode: string;
};

type EmojiPickerPosition = {
  top: string;
  left: string;
};

/**
 * Composable for handling emoji picker state and insertion
 */
export function useEmojiPicker() {
  const showEmojiPicker = ref(false);
  const emojiPickerPosition = ref<EmojiPickerPosition>({ top: '0px', left: '0px' });

  const EMOJI_PICKER_WIDTH = 350;

  /**
   * Toggle the emoji picker visibility and position it relative to the button
   */
  const toggleEmojiPicker = (event: MouseEvent) => {
    const buttonElement = event.currentTarget as HTMLElement;
    const offsetParent = buttonElement.offsetParent as HTMLElement | null;

    // Calculate initial position below the button
    const top = buttonElement.offsetTop + buttonElement.offsetHeight;
    let left = buttonElement.offsetLeft;

    // Check if the picker would overflow the right edge of the viewport
    const containerWidth = offsetParent?.clientWidth || window.innerWidth;
    const rightEdge = left + EMOJI_PICKER_WIDTH;

    // If the picker would overflow, align it to the right edge instead
    if (rightEdge > containerWidth) {
      left = Math.max(0, containerWidth - EMOJI_PICKER_WIDTH - 16);
    }

    emojiPickerPosition.value = {
      top: `${top}px`,
      left: `${left}px`,
    };

    showEmojiPicker.value = !showEmojiPicker.value;
  };

  /**
   * Close the emoji picker
   */
  const closeEmojiPicker = () => {
    showEmojiPicker.value = false;
  };

  /**
   * Insert an emoji into text at the given position
   */
  const insertEmoji = (params: {
    event: EmojiClickEvent;
    textarea: HTMLTextAreaElement;
    onUpdate: (newText: string) => void;
  }): void => {
    const { event, textarea, onUpdate } = params;

    const emojiChar = event?.unicode || '';

    if (!emojiChar) {
      console.error('Could not extract emoji from event:', event);
      return;
    }

    const cursorPositionStart = textarea.selectionStart;

    // Use the insertEmoji utility
    const newText = insertEmojiAtPosition({
      text: textarea.value,
      position: cursorPositionStart,
      emoji: emojiChar,
    });

    // Update textarea value
    textarea.value = newText;

    // Set cursor position after the emoji
    textarea.selectionStart = cursorPositionStart + emojiChar.length;
    textarea.selectionEnd = cursorPositionStart + emojiChar.length;

    // Update model and close picker
    onUpdate(textarea.value);
    showEmojiPicker.value = false;

    // Focus back on textarea
    textarea.focus();
  };

  return {
    showEmojiPicker,
    emojiPickerPosition,
    toggleEmojiPicker,
    closeEmojiPicker,
    insertEmoji,
  };
}

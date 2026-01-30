import { ref, onMounted, onBeforeUnmount, nextTick, type Ref } from 'vue';

type UseFullScreenEditorParams = {
  editorRef: Ref<HTMLTextAreaElement | null>;
  disableAutoFocus: Ref<boolean>;
};

/**
 * Composable for handling full-screen editor mode
 */
export function useFullScreenEditor(params: UseFullScreenEditorParams) {
  const { editorRef, disableAutoFocus } = params;

  const isFullScreen = ref(false);
  const showFormatted = ref(false);

  /**
   * Toggle full-screen mode
   */
  const toggleFullScreen = () => {
    isFullScreen.value = !isFullScreen.value;
    // When entering full-screen, switch to split mode showing both editor and preview
    if (isFullScreen.value) {
      showFormatted.value = false; // Ensure we're in split mode, not just preview
      // Focus the textarea when entering full-screen mode
      nextTick(() => {
        if (editorRef.value && !disableAutoFocus.value) {
          editorRef.value.focus();
        }
      });
    }
  };

  /**
   * Exit full-screen mode
   */
  const exitFullScreen = () => {
    isFullScreen.value = false;
  };

  /**
   * Handle escape key to exit full-screen
   */
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isFullScreen.value) {
      exitFullScreen();
    }
  };

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeydown);
  });

  return {
    isFullScreen,
    showFormatted,
    toggleFullScreen,
    exitFullScreen,
  };
}

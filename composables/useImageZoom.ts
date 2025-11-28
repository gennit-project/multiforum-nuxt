import { ref, computed } from 'vue';

export function useImageZoom() {
  const zoomLevel = ref(1);
  const isZoomed = computed(() => zoomLevel.value > 1);

  // Image panning
  const isDragging = ref(false);
  const startX = ref(0);
  const startY = ref(0);
  const translateX = ref(0);
  const translateY = ref(0);

  const startDrag = (event: MouseEvent) => {
    if (!isZoomed.value) return;

    // Only start dragging on left mouse button (button 0)
    if (event.button !== 0) return;

    event.preventDefault();
    isDragging.value = true;
    startX.value = event.clientX - translateX.value;
    startY.value = event.clientY - translateY.value;
  };

  const onDrag = (event: MouseEvent) => {
    // Only move if we're actively dragging (mouse button is held down)
    if (!isDragging.value) return;

    // Check if the event target is inside the text editor
    const target = event.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'TEXTAREA' ||
        target.closest('.text-editor-container') ||
        target.closest('button'))
    ) {
      return;
    }

    event.preventDefault();
    translateX.value = event.clientX - startX.value;
    translateY.value = event.clientY - startY.value;
  };

  const stopDrag = (event?: MouseEvent | TouchEvent | Event) => {
    // Stop dragging when mouse button is released
    isDragging.value = false;

    // If we have an event, check if the click is inside the editor
    if (event) {
      const target = event.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'TEXTAREA' ||
          target.closest('form') ||
          target.closest('button'))
      ) {
        // Don't do anything if the click is inside the editor
        event.stopPropagation();
      }
    }
  };

  // Handle touch events for mobile devices when zoomed in
  const startTouchDrag = (event: TouchEvent) => {
    // Only handle panning when zoomed in
    if (!isZoomed.value) return;

    const target = event.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'TEXTAREA' ||
        target.closest('.text-editor-container') ||
        target.closest('form') ||
        target.closest('button'))
    ) {
      return;
    }

    // Prevent default to avoid scrolling while panning
    event.preventDefault();
    isDragging.value = true;

    const touch = event.touches[0];
    if (!touch) return;
    startX.value = touch.clientX - translateX.value;
    startY.value = touch.clientY - translateY.value;
  };

  const onTouchDrag = (event: TouchEvent) => {
    if (!isDragging.value) return;

    event.preventDefault();

    const touch = event.touches[0];
    if (!touch) return;
    translateX.value = touch.clientX - startX.value;
    translateY.value = touch.clientY - startY.value;
  };

  // Reset translation when changing images or zoom
  const resetTranslation = () => {
    translateX.value = 0;
    translateY.value = 0;
  };

  // Zoom functions
  const zoomIn = () => {
    if (zoomLevel.value < 3) {
      zoomLevel.value += 0.5;
    }
  };

  const zoomOut = () => {
    if (zoomLevel.value > 1) {
      zoomLevel.value -= 0.5;
    }
  };

  const resetZoom = () => {
    zoomLevel.value = 1;
    resetTranslation();
  };

  return {
    zoomLevel,
    isZoomed,
    isDragging,
    translateX,
    translateY,
    startDrag,
    onDrag,
    stopDrag,
    startTouchDrag,
    onTouchDrag,
    resetTranslation,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}

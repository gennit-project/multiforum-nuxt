import { ref, computed } from 'vue';

/**
 * Lightbox zoom + pan state for the image detail page
 * (pages/u/[username]/images/[imageId].vue). Extracted from the component so
 * the zoom/drag/keyboard logic is unit-testable.
 *
 * The lightbox open guard is injected via `canOpenLightbox` so the component
 * can keep its url/format checks while the template binds `openLightbox`
 * directly (any event argument is ignored).
 */

export type UseImageZoomPanOptions = {
  canOpenLightbox?: () => boolean;
  /** Min/max zoom and step; defaults mirror the original component. */
  minZoom?: number;
  maxZoom?: number;
  step?: number;
};

const setBodyOverflow = (value: string) => {
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.overflow = value;
  }
};

export function useImageZoomPan(options: UseImageZoomPanOptions = {}) {
  const minZoom = options.minZoom ?? 1;
  const maxZoom = options.maxZoom ?? 3;
  const step = options.step ?? 0.5;

  const isLightboxOpen = ref(false);
  const zoomLevel = ref(minZoom);
  const isZoomed = computed(() => zoomLevel.value > 1);

  const isDragging = ref(false);
  const startX = ref(0);
  const startY = ref(0);
  const translateX = ref(0);
  const translateY = ref(0);

  const resetTranslation = () => {
    translateX.value = 0;
    translateY.value = 0;
  };

  const startDrag = (event: MouseEvent) => {
    if (!isZoomed.value) return;
    if (event.button !== 0) return;
    event.preventDefault();
    isDragging.value = true;
    startX.value = event.clientX - translateX.value;
    startY.value = event.clientY - translateY.value;
  };

  const onDrag = (event: MouseEvent) => {
    if (!isDragging.value) return;
    event.preventDefault();
    translateX.value = event.clientX - startX.value;
    translateY.value = event.clientY - startY.value;
  };

  const stopDrag = () => {
    isDragging.value = false;
  };

  const openLightbox = () => {
    const allowed = options.canOpenLightbox ? options.canOpenLightbox() : true;
    if (!allowed) return;
    isLightboxOpen.value = true;
    zoomLevel.value = minZoom;
    resetTranslation();
    setBodyOverflow('hidden');
  };

  const closeLightbox = () => {
    isLightboxOpen.value = false;
    zoomLevel.value = minZoom;
    resetTranslation();
    setBodyOverflow('');
  };

  const zoomIn = () => {
    if (zoomLevel.value < maxZoom) {
      zoomLevel.value += step;
    }
  };

  const zoomOut = () => {
    if (zoomLevel.value > minZoom) {
      zoomLevel.value -= step;
    }
  };

  const resetZoom = () => {
    zoomLevel.value = minZoom;
    resetTranslation();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isLightboxOpen.value) return;
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === '+') {
      zoomIn();
    } else if (e.key === '-') {
      zoomOut();
    } else if (e.key === '0') {
      resetZoom();
    }
  };

  return {
    isLightboxOpen,
    zoomLevel,
    isZoomed,
    isDragging,
    translateX,
    translateY,
    startDrag,
    onDrag,
    stopDrag,
    resetTranslation,
    openLightbox,
    closeLightbox,
    zoomIn,
    zoomOut,
    resetZoom,
    handleKeyDown,
  };
}

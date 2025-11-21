import { ref, watch, onMounted, onUnmounted, nextTick, type Ref } from 'vue';

export type PopoverPosition = {
  top: number;
  left: number;
  placement?: 'above' | 'below';
  triggerRect?: {
    top: number;
    bottom: number;
    height: number;
    width: number;
  };
};

type UsePopoverPositioningParams = {
  popoverRef: Ref<HTMLElement | null>;
  position: Ref<PopoverPosition>;
  isVisible: Ref<boolean>;
  contentDependencies?: Ref<any>[];
};

/**
 * Composable for handling popover positioning logic
 * Automatically adjusts popover position to stay within viewport
 */
export function usePopoverPositioning({
  popoverRef,
  position,
  isVisible,
  contentDependencies = [],
}: UsePopoverPositioningParams) {
  const adjustedPosition = ref({
    top: position.value?.top || 0,
    left: position.value?.left || 0,
  });

  /**
   * Calculate and update the adjusted position to keep popover within viewport
   */
  const updateAdjustedPosition = async () => {
    if (typeof window === 'undefined' || !isVisible.value) return;
    await nextTick();
    if (!popoverRef.value) return;

    const popoverRect = popoverRef.value.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 12;
    const triggerRect = position.value?.triggerRect;
    const preferredPlacement = position.value?.placement || 'below';

    let left = position.value?.left ?? 0;
    let top = position.value?.top ?? 0;

    const placeBelow = () =>
      (triggerRect?.bottom ?? position.value?.top ?? 0) + 8;
    const placeAbove = () =>
      (triggerRect?.top ?? position.value?.top ?? 0) - popoverRect.height - 8;

    // Handle vertical positioning
    if (triggerRect) {
      if (preferredPlacement === 'above') {
        let candidateTop = placeAbove();
        if (
          candidateTop < padding &&
          placeBelow() + popoverRect.height <= viewportHeight - padding
        ) {
          candidateTop = placeBelow();
        }
        top = candidateTop;
      } else {
        let candidateTop = placeBelow();
        if (
          candidateTop + popoverRect.height > viewportHeight - padding &&
          placeAbove() >= padding
        ) {
          candidateTop = placeAbove();
        }
        top = candidateTop;
      }
    }

    // Constrain to viewport vertically
    if (top + popoverRect.height > viewportHeight - padding) {
      top = viewportHeight - popoverRect.height - padding;
    }
    if (top < padding) {
      top = padding;
    }

    // Constrain to viewport horizontally
    if (left + popoverRect.width > viewportWidth - padding) {
      left = viewportWidth - popoverRect.width - padding;
    }
    if (left < padding) {
      left = padding;
    }

    adjustedPosition.value = { top, left };
  };

  /**
   * Handle viewport changes (resize, scroll)
   */
  const handleViewportChange = () => {
    if (!isVisible.value) return;
    updateAdjustedPosition();
  };

  // Watch for position changes
  watch(
    () => ({
      top: position.value?.top,
      left: position.value?.left,
      placement: position.value?.placement,
      isVisible: isVisible.value,
    }),
    (state) => {
      if (state.isVisible) {
        updateAdjustedPosition();
      }
    },
    { immediate: true }
  );

  // Watch for content changes that might affect size
  if (contentDependencies.length > 0) {
    watch(contentDependencies, () => {
      if (isVisible.value) {
        updateAdjustedPosition();
      }
    });
  }

  // Set up event listeners
  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleViewportChange);
      window.addEventListener('scroll', handleViewportChange, true);
    }
  });

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    }
  });

  return {
    adjustedPosition,
    updateAdjustedPosition,
  };
}

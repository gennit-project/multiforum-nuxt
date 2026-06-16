import { ref } from 'vue';

export type UseSwipeDetectionParams = {
  /** Minimum horizontal distance (px) to count as a swipe. */
  threshold?: number;
  /** Fired when the swipe goes left (end < start). */
  onSwipeLeft: () => void;
  /** Fired when the swipe goes right (end > start). */
  onSwipeRight: () => void;
};

/**
 * Horizontal swipe detection. The component records the start/end x positions
 * (after its own guards) and this fires the matching callback once the
 * distance crosses the threshold. Extracted from ImageLightbox for testability.
 */
export function useSwipeDetection(params: UseSwipeDetectionParams) {
  const { threshold = 50, onSwipeLeft, onSwipeRight } = params;
  const startX = ref(0);
  const endX = ref(0);

  const start = (x: number) => {
    startX.value = x;
  };

  const end = (x: number) => {
    endX.value = x;
    const distance = endX.value - startX.value;
    if (Math.abs(distance) <= threshold) return;
    if (distance > 0) {
      onSwipeRight();
    } else {
      onSwipeLeft();
    }
  };

  return { startX, endX, start, end };
}

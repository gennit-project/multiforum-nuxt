import { ref } from 'vue';

export type UseLightboxNavigationParams = {
  /** Getter for the number of images (read lazily so it stays current). */
  getCount: () => number;
  /** Starting index. */
  initialIndex?: number;
  /** Called after the index changes (e.g. to reset zoom/pan). */
  onNavigate?: () => void;
};

/**
 * Tracks the active index in a lightbox/carousel with wrap-around navigation.
 * Pure index logic, extracted from ImageLightbox so it can be unit-tested.
 */
export function useLightboxNavigation(params: UseLightboxNavigationParams) {
  const { getCount, initialIndex = 0, onNavigate } = params;
  const currentIndex = ref(initialIndex);

  const next = () => {
    const count = getCount();
    if (count === 0) return;
    currentIndex.value =
      currentIndex.value >= count - 1 ? 0 : currentIndex.value + 1;
    onNavigate?.();
  };

  const prev = () => {
    const count = getCount();
    if (count === 0) return;
    currentIndex.value =
      currentIndex.value <= 0 ? count - 1 : currentIndex.value - 1;
    onNavigate?.();
  };

  const jumpTo = (index: number) => {
    const count = getCount();
    if (count === 0) return;
    currentIndex.value = Math.max(0, Math.min(index, count - 1));
    onNavigate?.();
  };

  return { currentIndex, next, prev, jumpTo };
}

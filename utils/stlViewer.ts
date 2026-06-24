import type { CSSProperties } from 'vue';

/**
 * Pure helpers extracted from components/download/StlViewer.vue so the
 * dimension/camera math can be unit-tested without mounting three.js.
 */

/** Build the container inline style from numeric (px) or string dimensions. */
export function buildContainerStyle(
  width: number | string,
  height: number | string,
  maxWidth?: number | string | null
): CSSProperties {
  const style: CSSProperties = {};

  style.width = typeof width === 'number' ? `${width}px` : width;
  style.height = typeof height === 'number' ? `${height}px` : height;

  if (maxWidth) {
    style.maxWidth = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth;
  }

  return style;
}

/**
 * Distance to place the camera so an object of the given size fits the view,
 * derived from the largest object dimension and the camera field of view.
 */
export function calculateCameraDistance(
  maxDimension: number,
  fieldOfViewDegrees: number,
  scaleFactor = 1.5
): number {
  const fov = fieldOfViewDegrees * (Math.PI / 180);
  return Math.abs(maxDimension / Math.sin(fov / 2)) * scaleFactor;
}

/** Loading progress as a 0-100 percentage, guarding against a zero total. */
export function computeLoadProgressPercent(loaded: number, total: number): number {
  return total > 0 ? (loaded / total) * 100 : 0;
}

/**
 * File type detection utilities for 3D models and media files.
 * Used by album components, image viewers, and lightbox.
 */

/**
 * Check if the URL points to a GLB (glTF Binary) 3D model file.
 */
export const hasGlbExtension = (url: string | null | undefined): boolean => {
  return url?.toLowerCase().endsWith('.glb') ?? false;
};

/**
 * Check if the URL points to an STL 3D model file.
 */
export const hasStlExtension = (url: string | null | undefined): boolean => {
  return url?.toLowerCase().endsWith('.stl') ?? false;
};

/**
 * Check if the URL points to any supported 3D model format.
 */
export const is3DModelFile = (url: string | null | undefined): boolean => {
  return hasGlbExtension(url) || hasStlExtension(url);
};

/**
 * Check if the URL points to a standard image file (not a 3D model).
 */
export const isImageFile = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  return imageExtensions.some((ext) => lowerUrl.endsWith(ext));
};

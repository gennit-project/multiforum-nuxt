/**
 * Utility functions for album display and image handling.
 * Used by DiscussionAlbum, ImageLightbox, and download list components.
 */

import type { Image, Album } from '@/__generated__/graphql';

export type AlbumDimensionParams = {
  expandedView: boolean;
  downloadMode: boolean;
};

/**
 * Calculate the main image height based on view mode.
 */
export function getMainImageHeight(params: AlbumDimensionParams): number {
  const { expandedView, downloadMode } = params;
  if (!expandedView) return 256;
  return downloadMode ? 500 : 400;
}

/**
 * Calculate thumbnail dimensions based on view mode.
 */
export function getExpandedThumbnailDimensions(params: AlbumDimensionParams): {
  width: number;
  height: number;
} {
  const { expandedView, downloadMode } = params;
  if (expandedView && !downloadMode) {
    return { width: 180, height: 120 };
  }
  return { width: 120, height: 120 };
}

export type StlFileInput = {
  id?: string;
  url: string;
  fileName?: string;
};

export type OrderedImage = Image & {
  isStlFile?: boolean;
  fileName?: string;
};

/**
 * Order album images according to imageOrder array and combine with STL files.
 * Images without a defined order are placed after ordered images.
 */
export function getOrderedAlbumImages(params: {
  album: Album | null;
  stlFiles?: StlFileInput[];
}): OrderedImage[] {
  const { album, stlFiles = [] } = params;
  let albumImages: Image[] = [];

  if (album) {
    if (!album.imageOrder || album.imageOrder.length === 0) {
      albumImages = (album.Images || []) as Image[];
    } else {
      albumImages = album.imageOrder
        .map((imageId) => {
          const foundImage = album?.Images?.find(
            (image) => image.id === imageId
          );
          return foundImage;
        })
        .filter((image): image is Image => image !== undefined);
    }
  }

  // Create synthetic "image" objects for STL files
  const stlAsImages = stlFiles.map((stlFile, index) => ({
    id: `stl-${stlFile.id || index}`,
    url: stlFile.url,
    alt: stlFile.fileName || `3D Model ${index + 1}`,
    caption: stlFile.fileName || `3D Model: ${stlFile.fileName}`,
    isStlFile: true,
    fileName: stlFile.fileName,
  })) as OrderedImage[];

  // Combine album images with STL files
  return [...albumImages, ...stlAsImages];
}

/**
 * Get the first image URL from an album, respecting imageOrder.
 * Returns null if no images are available.
 */
export function getFirstAlbumImage(album: Album | null | undefined): string | null {
  if (!album?.Images?.length) return null;

  // If imageOrder exists and has items, use the first ordered image
  if (album.imageOrder?.length && album.imageOrder.length > 0) {
    const firstImageId = album.imageOrder[0];
    const orderedImage = album.Images.find((img) => img.id === firstImageId);
    if (orderedImage?.url) return orderedImage.url;
  }

  // Fallback to first image in the Images array
  return album.Images[0]?.url || null;
}

/**
 * Calculate navigation index for carousel (wrapping).
 */
export function navigateCarousel(params: {
  currentIndex: number;
  totalImages: number;
  direction: 'left' | 'right';
}): number {
  const { currentIndex, totalImages, direction } = params;

  if (totalImages === 0) return 0;

  if (direction === 'left') {
    if (currentIndex === 0) {
      return totalImages - 1;
    }
    return currentIndex - 1;
  } else {
    if (currentIndex === totalImages - 1) {
      return 0;
    }
    return currentIndex + 1;
  }
}

/**
 * Determine if a swipe gesture should trigger navigation.
 * Returns direction if swipe is valid, null otherwise.
 */
export function detectSwipeDirection(params: {
  startX: number;
  endX: number;
  threshold?: number;
}): 'left' | 'right' | null {
  const { startX, endX, threshold = 50 } = params;
  const swipeDistance = endX - startX;

  if (Math.abs(swipeDistance) > threshold) {
    return swipeDistance > 0 ? 'left' : 'right';
  }
  return null;
}

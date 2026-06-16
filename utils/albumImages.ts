/**
 * Pure helpers for turning an album's stored images into the editor form's
 * shape and deriving the initial image order, extracted from AlbumEditForm.
 */

export type AlbumImageSource = {
  id?: string | null;
  url?: string | null;
  alt?: string | null;
  caption?: string | null;
  copyright?: string | null;
};

export type AlbumFormImage = {
  id: string;
  url: string;
  alt: string;
  caption: string;
  isCoverImage: boolean;
  hasSensitiveContent: boolean;
  hasSpoiler: boolean;
  copyright: string;
};

export function mapAlbumImagesToForm(
  albumImages: AlbumImageSource[] | null | undefined
): AlbumFormImage[] {
  if (!albumImages) return [];
  return albumImages.map((image) => ({
    id: image.id || '',
    url: image.url || '',
    alt: image.alt || '',
    caption: image.caption || '',
    isCoverImage: false,
    hasSensitiveContent: false,
    hasSpoiler: false,
    copyright: image.copyright || '',
  }));
}

export type InitialImageOrderParams = {
  albumImageOrder: (string | null | undefined)[] | null | undefined;
  images: AlbumFormImage[];
};

/**
 * Use the album's stored order when present (string ids only); otherwise build
 * an order from the images that have a (truthy) id.
 */
export function getInitialImageOrder(
  params: InitialImageOrderParams
): string[] {
  const { albumImageOrder, images } = params;

  const existing = (albumImageOrder || []).filter(
    (id): id is string => typeof id === 'string'
  );
  if (existing.length) {
    return existing;
  }

  return images.filter((image) => Boolean(image.id)).map((image) => image.id);
}

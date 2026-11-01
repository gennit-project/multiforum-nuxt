import type { DiscussionAlbumInput, DiscussionAlbumImageUpdateInput } from '@/__generated__/graphql';
import { normalizeImageOrder } from '@/utils/albumImageOrder';

export type AlbumUpdateImageInput = {
  id?: string | null;
  url?: string | null;
  alt?: string | null;
  caption?: string | null;
  copyright?: string | null;
};
export type AlbumFormData = {
  images?: AlbumUpdateImageInput[];
  imageOrder?: string[];
} | null | undefined;
export type ExistingAlbumImage = AlbumUpdateImageInput;

/** Complete membership plus changed metadata; never writes uploader or URL fields. */
export function buildAlbumUpdateInput(params: {
  albumData: AlbumFormData;
  existingImages?: ExistingAlbumImage[];
  existingImageOrder?: (string | null | undefined)[] | null;
}): DiscussionAlbumInput | undefined {
  const { albumData, existingImages = [], existingImageOrder } = params;
  if (!albumData) return undefined;
  const images = (albumData.images ?? []).filter((image) => typeof image.id === 'string' && image.id.trim().length > 0);
  const imageIds = normalizeImageOrder({ images, imageOrder: albumData.imageOrder });
  const previousIds = normalizeImageOrder({ images: existingImages.filter((image) => typeof image.id === 'string' && image.id.trim().length > 0), imageOrder: existingImageOrder });
  const imageUpdates: DiscussionAlbumImageUpdateInput[] = [];
  for (const id of imageIds) {
    const image = images.find((item) => item.id === id);
    const previous = existingImages.find((item) => item.id === id);
    // Newly uploaded/reused images already exist; their metadata was not edited
    // against this album's baseline. Membership must not grant uploader rights.
    if (!image || !previous) continue;
    const update: DiscussionAlbumImageUpdateInput = { id };
    for (const field of ['alt', 'caption', 'copyright'] as const) {
      const value = image[field];
      const old = previous[field];
      if (value === undefined || value === old || (value === '' && old == null)) continue;
      update[field] = value;
    }
    if (Object.keys(update).length > 1) imageUpdates.push(update);
  }
  if (imageIds.length === previousIds.length && imageIds.every((id, index) => id === previousIds[index]) && imageUpdates.length === 0) return undefined;
  return imageUpdates.length ? { imageIds, imageUpdates } : { imageIds };
}

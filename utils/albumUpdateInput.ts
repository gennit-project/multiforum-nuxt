/**
 * Pure builder extracted from the download edit page
 * (pages/forums/[forumId]/downloads/edit/[discussionId].vue). Produces the
 * `Album` portion of a discussion update input, choosing between creating a new
 * album and updating an existing one (connect/update/disconnect images).
 */

export type AlbumFormImage = {
  id?: string | null;
  url?: string | null;
  alt?: string | null;
  caption?: string | null;
  copyright?: string | null;
};

export type AlbumFormData = {
  images?: AlbumFormImage[];
  imageOrder?: string[];
} | null | undefined;

export type ExistingAlbumImage = { id?: string | null };

export function buildAlbumUpdateInput(params: {
  albumData: AlbumFormData;
  existingAlbumId?: string | null;
  existingImages?: ExistingAlbumImage[];
}) {
  const { albumData, existingAlbumId, existingImages = [] } = params;

  if (
    !albumData ||
    (!albumData.images?.length && !albumData.imageOrder?.length)
  ) {
    return {}; // No album data to update
  }

  // If the album doesn't exist yet, CREATE it and connect to existing images.
  if (!existingAlbumId) {
    const newImages = albumData.images || [];
    const validImages = newImages.filter(
      (img): img is AlbumFormImage & { id: string } => Boolean(img.id)
    );

    if (validImages.length === 0) {
      return {}; // No valid images to connect
    }

    const albumNode: {
      imageOrder: string[];
      Images: { connect: { where: { node: { id: string } } }[] };
    } = {
      imageOrder: albumData.imageOrder || [],
      Images: {
        connect: validImages.map((img) => ({
          where: { node: { id: img.id } },
        })),
      },
    };

    return { Album: { create: { node: albumNode } } };
  }

  // Existing album: build connect/update/disconnect arrays.
  const oldImages = existingImages;
  const newImages = albumData.images || [];

  const connectImageArray = newImages
    .filter((img) => img.id && !oldImages.some((old) => old.id === img.id))
    .map((img) => ({ connect: [{ where: { node: { id: img.id } } }] }));

  const updateImageArray = newImages
    .filter((img) => img.id && oldImages.some((old) => old.id === img.id))
    .map((img) => ({
      where: { node: { id: img.id } },
      update: {
        node: {
          url: img.url,
          alt: img.alt,
          caption: img.caption,
          copyright: img.copyright,
        },
      },
    }));

  const disconnectImageArray = oldImages
    .filter((old) => !newImages.some((img) => img.id === old.id))
    .map((old) => ({ disconnect: [{ where: { node: { id: old.id } } }] }));

  const imagesOps = [
    ...connectImageArray,
    ...updateImageArray,
    ...disconnectImageArray,
  ];

  return {
    Album: {
      update: {
        node: {
          imageOrder: albumData.imageOrder || [],
          Images: imagesOps,
        },
      },
    },
  };
}

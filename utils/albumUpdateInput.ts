import type {
  DiscussionUpdateInput,
  AlbumImagesConnectFieldInput,
  AlbumImagesUpdateFieldInput,
} from '@/__generated__/graphql';

/**
 * Pure builder extracted from the download edit page
 * (pages/forums/[forumId]/downloads/edit/[discussionId].vue). Produces the
 * `Album` portion of a discussion update input, choosing between creating a new
 * album and updating an existing one (connect/update/disconnect images).
 *
 * The return type is `Pick<DiscussionUpdateInput, 'Album'>`, so the generated
 * GraphQL schema validates the produced shape at compile time.
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

export type AlbumUpdatePortion = Pick<DiscussionUpdateInput, 'Album'>;

export function buildAlbumUpdateInput(params: {
  albumData: AlbumFormData;
  existingAlbumId?: string | null;
  existingImages?: ExistingAlbumImage[];
}): AlbumUpdatePortion {
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

    const connect: AlbumImagesConnectFieldInput[] = validImages.map((img) => ({
      where: { node: { id: img.id } },
    }));

    return {
      Album: {
        create: {
          node: {
            imageOrder: albumData.imageOrder || [],
            Images: { connect },
          },
        },
      },
    };
  }

  // Existing album: build connect/update/disconnect operations.
  const oldImages = existingImages;
  const newImages = albumData.images || [];

  const connectImageArray: AlbumImagesUpdateFieldInput[] = newImages
    .filter((img) => img.id && !oldImages.some((old) => old.id === img.id))
    .map((img) => ({ connect: [{ where: { node: { id: img.id } } }] }));

  const updateImageArray: AlbumImagesUpdateFieldInput[] = newImages
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

  const disconnectImageArray: AlbumImagesUpdateFieldInput[] = oldImages
    .filter((old) => !newImages.some((img) => img.id === old.id))
    .map((old) => ({ disconnect: [{ where: { node: { id: old.id } } }] }));

  const imagesOps: AlbumImagesUpdateFieldInput[] = [
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

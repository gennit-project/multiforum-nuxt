import type {
  AlbumUpdateInput,
  DiscussionAlbumCreateFieldInput,
  AlbumImagesConnectFieldInput,
  AlbumImagesUpdateFieldInput,
} from '@/__generated__/graphql';
import { normalizeImageOrder } from '@/utils/albumImageOrder';

/**
 * Pure builder extracted from the download edit page
 * (pages/forums/[forumId]/downloads/edit/[discussionId].vue). Produces the
 * `Album` portion of a discussion update input, choosing between creating a new
 * album and updating an existing one (connect/update/disconnect images).
 *
 * This is a legacy UI-to-payload builder, not a valid DiscussionUpdateInput.
 * The pending companion contract must replace it before the raw boundary can
 * migrate to generated operation variables.
 */

export type AlbumUpdateImageInput = {
  id?: string | null;
  url?: string | null;
  alt?: string | null;
  caption?: string | null;
  copyright?: string | null;
};

export type AlbumFormData =
  | {
      images?: AlbumUpdateImageInput[];
      imageOrder?: string[];
    }
  | null
  | undefined;

export type ExistingAlbumImage = { id?: string | null };

// v7's generated `DiscussionUpdateInput` no longer exposes the nested `Album`
// relationship, but the custom `updateDiscussionWithChannelConnections` resolver
// reads a loose `Album` field that GraphQL coercion rejects before execution.
// Nested generated Album types do not make the enclosing request valid.
export type AlbumUpdatePortion = {
  Album?: {
    create?: DiscussionAlbumCreateFieldInput;
    update?: { node: AlbumUpdateInput };
  };
};

export function buildAlbumUpdateInput(params: {
  albumData: AlbumFormData;
  existingAlbumId?: string | null;
  existingImages?: ExistingAlbumImage[];
}): AlbumUpdatePortion {
  const { albumData, existingAlbumId, existingImages = [] } = params;

  if (!albumData) {
    return {}; // No album data to update
  }

  // If the album doesn't exist yet, CREATE it and connect to existing images.
  if (!existingAlbumId) {
    const newImages = albumData.images || [];
    const validImages = newImages.filter(
      (img): img is AlbumUpdateImageInput & { id: string } => Boolean(img.id)
    );

    if (validImages.length === 0) {
      return {}; // No valid images to connect
    }

    const connect: AlbumImagesConnectFieldInput[] = validImages.map((img) => ({
      where: { node: { id: { eq: img.id } } },
    }));
    const normalizedImageOrder = normalizeImageOrder({
      images: validImages,
      imageOrder: albumData.imageOrder,
    });

    return {
      Album: {
        create: {
          node: {
            imageOrder: normalizedImageOrder,
            Images: { connect },
          },
        },
      },
    };
  }

  // Existing album: build connect/update/disconnect operations.
  const oldImages = existingImages;
  const newImages = albumData.images || [];
  const normalizedImageOrder = normalizeImageOrder({
    images: newImages,
    imageOrder: albumData.imageOrder,
  });

  const connectImageArray: AlbumImagesUpdateFieldInput[] = newImages
    .filter((img) => img.id && !oldImages.some((old) => old.id === img.id))
    .map((img) => ({ connect: [{ where: { node: { id: { eq: img.id } } } }] }));

  const updateImageArray: AlbumImagesUpdateFieldInput[] = newImages
    .filter((img) => img.id && oldImages.some((old) => old.id === img.id))
    .map((img) => ({
      update: {
        where: { node: { id: { eq: img.id } } },
        node: {
          url: { set: img.url },
          alt: { set: img.alt },
          caption: { set: img.caption },
          copyright: { set: img.copyright },
        },
      },
    }));

  const disconnectImageArray: AlbumImagesUpdateFieldInput[] = oldImages
    .filter((old) => !newImages.some((img) => img.id === old.id))
    .map((old) => ({
      disconnect: [{ where: { node: { id: { eq: old.id } } } }],
    }));

  const imagesOps: AlbumImagesUpdateFieldInput[] = [
    ...connectImageArray,
    ...updateImageArray,
    ...disconnectImageArray,
  ];

  return {
    Album: {
      update: {
        node: {
          imageOrder: { set: normalizedImageOrder },
          Images: imagesOps,
        },
      },
    },
  };
}

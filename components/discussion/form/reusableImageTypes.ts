import type { ImageWhere } from '@/__generated__/graphql';

// Shape the reusable-image picker (and its shared grid) render for each image.
// Kept minimal on purpose: the picker only needs enough to preview an image and
// connect it to an album by id, preserving the original uploader attribution.
export type ReusableImage = {
  id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
  copyright?: string | null;
  createdAt?: string | null;
  Uploader?: {
    username?: string | null;
    displayName?: string | null;
  } | null;
};

// Build the ImageWhere filter shared by every source tab: always exclude
// archived / permanently-removed images, and, when a search term is present,
// match it against the image's text fields.
export const buildReusableImageWhere = (searchTerm: string): ImageWhere => {
  const base: ImageWhere = {
    archived: false,
    permanentlyRemoved: false,
  };
  const trimmedSearch = searchTerm.trim();

  if (!trimmedSearch) {
    return base;
  }

  return {
    AND: [
      base,
      {
        OR: [
          { id_CONTAINS: trimmedSearch },
          { url_CONTAINS: trimmedSearch },
          { alt_CONTAINS: trimmedSearch },
          { caption_CONTAINS: trimmedSearch },
          { copyright_CONTAINS: trimmedSearch },
        ],
      },
    ],
  };
};

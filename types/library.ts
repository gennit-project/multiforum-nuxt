import type { RouteLocationRaw } from 'vue-router';

export type LibraryFavoriteKind =
  'discussion' | 'download' | 'image' | 'comment' | 'channel';

export type LibraryFavoriteSource = {
  forumName: string;
  forumUniqueName: string;
  uploaderName: string;
  uploaderUsername: string;
};

export type LibraryFavoriteItem = {
  id: string;
  kind: LibraryFavoriteKind;
  title: string;
  summary: string;
  href: RouteLocationRaw;
  thumbnailUrl?: string | null;
  createdAt?: string | null;
  source: LibraryFavoriteSource;
};

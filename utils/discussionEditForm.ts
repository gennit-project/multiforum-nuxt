import type { CreateEditDiscussionFormValues } from '@/types/Discussion';

/**
 * Map a loaded discussion into the edit form's values. Extracted from
 * discussions/edit/[discussionId].vue so the field mapping — and the
 * validImageOrder cross-check (drop ids that don't reference a kept image) —
 * is unit-testable.
 */

type EditImage = {
  id?: string | null;
  url?: string | null;
  alt?: string | null;
  caption?: string | null;
  copyright?: string | null;
};

export type DiscussionEditSource = {
  title?: string | null;
  body?: string | null;
  Tags?: { text: string }[] | null;
  DiscussionChannels?:
    | { Channel?: { uniqueName?: string | null } | null }[]
    | null;
  Author?: { username?: string | null } | null;
  Album?: {
    Images?: EditImage[] | null;
    imageOrder?: (string | null | undefined)[] | null;
  } | null;
  CrosspostedDiscussion?: { id?: string | null } | null;
};

export function buildDiscussionEditFormValues(
  discussion: DiscussionEditSource
): CreateEditDiscussionFormValues {
  // Only keep images that have both an id and a url.
  const validImages = (discussion.Album?.Images ?? [])
    .filter((image) => image.id && image.url)
    .map((image) => ({
      id: image.id ?? undefined,
      url: image.url ?? '',
      alt: image.alt ?? '',
      caption: image.caption ?? '',
      copyright: image.copyright ?? '',
    }));

  // Drop order ids that are empty or don't reference a kept image.
  const validImageOrder = (discussion.Album?.imageOrder ?? []).filter(
    (id): id is string =>
      typeof id === 'string' &&
      id.length > 0 &&
      validImages.some((image) => image.id === id)
  );

  return {
    title: discussion.title ?? '',
    body: discussion.body ?? '',
    selectedTags: (discussion.Tags ?? []).map((tag) => tag.text),
    selectedChannels: (discussion.DiscussionChannels ?? []).map(
      (discussionChannel) => discussionChannel?.Channel?.uniqueName ?? ''
    ),
    author: discussion.Author?.username ?? '',
    album: {
      images: validImages,
      imageOrder: validImageOrder,
    },
    crosspostId: discussion.CrosspostedDiscussion?.id || null,
  };
}

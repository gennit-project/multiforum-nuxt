import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useCollectionMutations } from '@/composables/useCollectionMutations';
import {
  CreateCollectionDocument as CREATE_COLLECTION,
  AddCommentToCollectionDocument as ADD_COMMENT_TO_COLLECTION,
  AddImageToCollectionDocument as ADD_IMAGE_TO_COLLECTION,
  RemoveChannelFromCollectionDocument as REMOVE_CHANNEL_FROM_COLLECTION,
  AddChannelToCollectionDocument as ADD_CHANNEL_TO_COLLECTION,
  RemoveDiscussionFromCollectionDocument as REMOVE_DISCUSSION_FROM_COLLECTION,
  RemoveImageFromCollectionDocument as REMOVE_IMAGE_FROM_COLLECTION,
  RemoveCommentFromCollectionDocument as REMOVE_COMMENT_FROM_COLLECTION,
  RemoveDownloadFromCollectionDocument as REMOVE_DOWNLOAD_FROM_COLLECTION,
  AddDiscussionToCollectionDocument as ADD_DISCUSSION_TO_COLLECTION,
  AddDownloadToCollectionDocument as ADD_DOWNLOAD_TO_COLLECTION,
  RemoveFavoriteDiscussionDocument as REMOVE_FAVORITE_DISCUSSION,
  AddFavoriteCommentDocument as ADD_FAVORITE_COMMENT,
  RemoveFavoriteCommentDocument as REMOVE_FAVORITE_COMMENT,
  AddFavoriteChannelDocument as ADD_FAVORITE_CHANNEL,
  AddFavoriteImageDocument as ADD_FAVORITE_IMAGE,
  AddFavoriteDiscussionDocument as ADD_FAVORITE_DISCUSSION,
  RemoveFavoriteImageDocument as REMOVE_FAVORITE_IMAGE,
  RemoveFavoriteChannelDocument as REMOVE_FAVORITE_CHANNEL,
} from '@/__generated__/operations';

const mutateByDoc = new Map<unknown, ReturnType<typeof vi.fn>>();

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (doc: unknown) => {
    if (!mutateByDoc.has(doc)) {
      mutateByDoc.set(doc, vi.fn());
    }
    return { mutate: mutateByDoc.get(doc) };
  },
}));

describe('useCollectionMutations', () => {
  const itemTypeCases = {
    add: [
      {
        name: 'discussion add maps to discussion mutation',
        itemType: 'discussion',
        expected: ADD_DISCUSSION_TO_COLLECTION,
      },
      {
        name: 'comment add maps to comment mutation',
        itemType: 'comment',
        expected: ADD_COMMENT_TO_COLLECTION,
      },
      {
        name: 'image add maps to image mutation',
        itemType: 'image',
        expected: ADD_IMAGE_TO_COLLECTION,
      },
      {
        name: 'channel add maps to channel mutation',
        itemType: 'channel',
        expected: ADD_CHANNEL_TO_COLLECTION,
      },
      {
        name: 'download add maps to download mutation',
        itemType: 'download',
        expected: ADD_DOWNLOAD_TO_COLLECTION,
      },
    ],
    remove: [
      {
        name: 'discussion remove maps to discussion mutation',
        itemType: 'discussion',
        expected: REMOVE_DISCUSSION_FROM_COLLECTION,
      },
      {
        name: 'comment remove maps to comment mutation',
        itemType: 'comment',
        expected: REMOVE_COMMENT_FROM_COLLECTION,
      },
      {
        name: 'image remove maps to image mutation',
        itemType: 'image',
        expected: REMOVE_IMAGE_FROM_COLLECTION,
      },
      {
        name: 'channel remove maps to channel mutation',
        itemType: 'channel',
        expected: REMOVE_CHANNEL_FROM_COLLECTION,
      },
      {
        name: 'download remove maps to download mutation',
        itemType: 'download',
        expected: REMOVE_DOWNLOAD_FROM_COLLECTION,
      },
    ],
    addFavorite: [
      {
        name: 'discussion favorite add maps to discussion mutation',
        itemType: 'discussion',
        expected: ADD_FAVORITE_DISCUSSION,
      },
      {
        name: 'comment favorite add maps to comment mutation',
        itemType: 'comment',
        expected: ADD_FAVORITE_COMMENT,
      },
      {
        name: 'image favorite add maps to image mutation',
        itemType: 'image',
        expected: ADD_FAVORITE_IMAGE,
      },
      {
        name: 'channel favorite add maps to channel mutation',
        itemType: 'channel',
        expected: ADD_FAVORITE_CHANNEL,
      },
      {
        name: 'download favorite add maps to discussion mutation',
        itemType: 'download',
        expected: ADD_FAVORITE_DISCUSSION,
      },
    ],
    removeFavorite: [
      {
        name: 'discussion favorite remove maps to discussion mutation',
        itemType: 'discussion',
        expected: REMOVE_FAVORITE_DISCUSSION,
      },
      {
        name: 'comment favorite remove maps to comment mutation',
        itemType: 'comment',
        expected: REMOVE_FAVORITE_COMMENT,
      },
      {
        name: 'image favorite remove maps to image mutation',
        itemType: 'image',
        expected: REMOVE_FAVORITE_IMAGE,
      },
      {
        name: 'channel favorite remove maps to channel mutation',
        itemType: 'channel',
        expected: REMOVE_FAVORITE_CHANNEL,
      },
      {
        name: 'download favorite remove maps to discussion mutation',
        itemType: 'download',
        expected: REMOVE_FAVORITE_DISCUSSION,
      },
    ],
  } as const;

  beforeEach(() => {
    mutateByDoc.clear();
  });

  it('exposes createCollection mutation', () => {
    const { createCollection } = useCollectionMutations('discussion');

    expect(createCollection).toBe(mutateByDoc.get(CREATE_COLLECTION));
  });

  it.each(itemTypeCases.add)('$name', ({ itemType, expected }) => {
    const { getAddMutation } = useCollectionMutations(
      itemType as Parameters<typeof useCollectionMutations>[0]
    );

    expect(getAddMutation()).toBe(mutateByDoc.get(expected));
  });

  it.each(itemTypeCases.remove)('$name', ({ itemType, expected }) => {
    const { getRemoveMutation } = useCollectionMutations(
      itemType as Parameters<typeof useCollectionMutations>[0]
    );

    expect(getRemoveMutation()).toBe(mutateByDoc.get(expected));
  });

  it.each(itemTypeCases.addFavorite)('$name', ({ itemType, expected }) => {
    const { getAddFavoriteMutation } = useCollectionMutations(
      itemType as Parameters<typeof useCollectionMutations>[0]
    );

    getAddFavoriteMutation()({ itemId: 'item', username: 'alice' });
    const variable =
      itemType === 'channel'
        ? 'channel'
        : itemType === 'comment'
          ? 'commentId'
          : itemType === 'image'
            ? 'imageId'
            : 'discussionId';
    expect(mutateByDoc.get(expected)).toHaveBeenCalledWith({
      [variable]: 'item',
      username: 'alice',
    });
  });

  it.each(itemTypeCases.removeFavorite)('$name', ({ itemType, expected }) => {
    const { getRemoveFavoriteMutation } = useCollectionMutations(
      itemType as Parameters<typeof useCollectionMutations>[0]
    );

    getRemoveFavoriteMutation()({ itemId: 'item', username: 'alice' });
    const variable =
      itemType === 'channel'
        ? 'channel'
        : itemType === 'comment'
          ? 'commentId'
          : itemType === 'image'
            ? 'imageId'
            : 'discussionId';
    expect(mutateByDoc.get(expected)).toHaveBeenCalledWith({
      [variable]: 'item',
      username: 'alice',
    });
  });
});

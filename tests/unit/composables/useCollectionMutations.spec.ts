import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useCollectionMutations } from '@/composables/useCollectionMutations';
import * as mutations from '@/graphQLData/collection/mutations';
import * as userMutations from '@/graphQLData/user/mutations';

const mutateByDoc = new Map<unknown, ReturnType<typeof vi.fn>>();

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (doc: unknown) => {
    if (!mutateByDoc.has(doc)) {
      mutateByDoc.set(doc, vi.fn());
    }
    return { mutate: mutateByDoc.get(doc) };
  },
}));

vi.mock('@/graphQLData/collection/mutations', () => ({
  CREATE_COLLECTION: Symbol('CREATE_COLLECTION'),
  ADD_DISCUSSION_TO_COLLECTION: Symbol('ADD_DISCUSSION_TO_COLLECTION'),
  ADD_COMMENT_TO_COLLECTION: Symbol('ADD_COMMENT_TO_COLLECTION'),
  ADD_IMAGE_TO_COLLECTION: Symbol('ADD_IMAGE_TO_COLLECTION'),
  ADD_CHANNEL_TO_COLLECTION: Symbol('ADD_CHANNEL_TO_COLLECTION'),
  ADD_DOWNLOAD_TO_COLLECTION: Symbol('ADD_DOWNLOAD_TO_COLLECTION'),
  REMOVE_DISCUSSION_FROM_COLLECTION: Symbol('REMOVE_DISCUSSION_FROM_COLLECTION'),
  REMOVE_COMMENT_FROM_COLLECTION: Symbol('REMOVE_COMMENT_FROM_COLLECTION'),
  REMOVE_IMAGE_FROM_COLLECTION: Symbol('REMOVE_IMAGE_FROM_COLLECTION'),
  REMOVE_CHANNEL_FROM_COLLECTION: Symbol('REMOVE_CHANNEL_FROM_COLLECTION'),
  REMOVE_DOWNLOAD_FROM_COLLECTION: Symbol('REMOVE_DOWNLOAD_FROM_COLLECTION'),
}));

vi.mock('@/graphQLData/user/mutations', () => ({
  ADD_FAVORITE_DISCUSSION: Symbol('ADD_FAVORITE_DISCUSSION'),
  REMOVE_FAVORITE_DISCUSSION: Symbol('REMOVE_FAVORITE_DISCUSSION'),
  ADD_FAVORITE_COMMENT: Symbol('ADD_FAVORITE_COMMENT'),
  REMOVE_FAVORITE_COMMENT: Symbol('REMOVE_FAVORITE_COMMENT'),
  ADD_FAVORITE_IMAGE: Symbol('ADD_FAVORITE_IMAGE'),
  REMOVE_FAVORITE_IMAGE: Symbol('REMOVE_FAVORITE_IMAGE'),
  ADD_FAVORITE_CHANNEL: Symbol('ADD_FAVORITE_CHANNEL'),
  REMOVE_FAVORITE_CHANNEL: Symbol('REMOVE_FAVORITE_CHANNEL'),
}));

describe('useCollectionMutations', () => {
  const itemTypeCases = {
    add: [
      {
        name: 'discussion add maps to discussion mutation',
        itemType: 'discussion',
        expected: mutations.ADD_DISCUSSION_TO_COLLECTION,
      },
      {
        name: 'comment add maps to comment mutation',
        itemType: 'comment',
        expected: mutations.ADD_COMMENT_TO_COLLECTION,
      },
      {
        name: 'image add maps to image mutation',
        itemType: 'image',
        expected: mutations.ADD_IMAGE_TO_COLLECTION,
      },
      {
        name: 'channel add maps to channel mutation',
        itemType: 'channel',
        expected: mutations.ADD_CHANNEL_TO_COLLECTION,
      },
      {
        name: 'download add maps to download mutation',
        itemType: 'download',
        expected: mutations.ADD_DOWNLOAD_TO_COLLECTION,
      },
    ],
    remove: [
      {
        name: 'discussion remove maps to discussion mutation',
        itemType: 'discussion',
        expected: mutations.REMOVE_DISCUSSION_FROM_COLLECTION,
      },
      {
        name: 'comment remove maps to comment mutation',
        itemType: 'comment',
        expected: mutations.REMOVE_COMMENT_FROM_COLLECTION,
      },
      {
        name: 'image remove maps to image mutation',
        itemType: 'image',
        expected: mutations.REMOVE_IMAGE_FROM_COLLECTION,
      },
      {
        name: 'channel remove maps to channel mutation',
        itemType: 'channel',
        expected: mutations.REMOVE_CHANNEL_FROM_COLLECTION,
      },
      {
        name: 'download remove maps to download mutation',
        itemType: 'download',
        expected: mutations.REMOVE_DOWNLOAD_FROM_COLLECTION,
      },
    ],
    addFavorite: [
      {
        name: 'discussion favorite add maps to discussion mutation',
        itemType: 'discussion',
        expected: userMutations.ADD_FAVORITE_DISCUSSION,
      },
      {
        name: 'comment favorite add maps to comment mutation',
        itemType: 'comment',
        expected: userMutations.ADD_FAVORITE_COMMENT,
      },
      {
        name: 'image favorite add maps to image mutation',
        itemType: 'image',
        expected: userMutations.ADD_FAVORITE_IMAGE,
      },
      {
        name: 'channel favorite add maps to channel mutation',
        itemType: 'channel',
        expected: userMutations.ADD_FAVORITE_CHANNEL,
      },
      {
        name: 'download favorite add maps to discussion mutation',
        itemType: 'download',
        expected: userMutations.ADD_FAVORITE_DISCUSSION,
      },
    ],
    removeFavorite: [
      {
        name: 'discussion favorite remove maps to discussion mutation',
        itemType: 'discussion',
        expected: userMutations.REMOVE_FAVORITE_DISCUSSION,
      },
      {
        name: 'comment favorite remove maps to comment mutation',
        itemType: 'comment',
        expected: userMutations.REMOVE_FAVORITE_COMMENT,
      },
      {
        name: 'image favorite remove maps to image mutation',
        itemType: 'image',
        expected: userMutations.REMOVE_FAVORITE_IMAGE,
      },
      {
        name: 'channel favorite remove maps to channel mutation',
        itemType: 'channel',
        expected: userMutations.REMOVE_FAVORITE_CHANNEL,
      },
      {
        name: 'download favorite remove maps to discussion mutation',
        itemType: 'download',
        expected: userMutations.REMOVE_FAVORITE_DISCUSSION,
      },
    ],
  } as const;

  beforeEach(() => {
    mutateByDoc.clear();
  });

  it('exposes createCollection mutation', () => {
    const { createCollection } = useCollectionMutations('discussion');

    expect(createCollection).toBe(mutateByDoc.get(mutations.CREATE_COLLECTION));
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

    expect(getAddFavoriteMutation()).toBe(mutateByDoc.get(expected));
  });

  it.each(itemTypeCases.removeFavorite)('$name', ({ itemType, expected }) => {
    const { getRemoveFavoriteMutation } = useCollectionMutations(
      itemType as Parameters<typeof useCollectionMutations>[0]
    );

    expect(getRemoveFavoriteMutation()).toBe(mutateByDoc.get(expected));
  });
});

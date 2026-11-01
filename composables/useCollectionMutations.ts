import { useMutation } from '@vue/apollo-composable';
import {
  CreateCollectionDocument as CREATE_COLLECTION,
  AddDiscussionToCollectionDocument as ADD_DISCUSSION_TO_COLLECTION,
  AddCommentToCollectionDocument as ADD_COMMENT_TO_COLLECTION,
  AddImageToCollectionDocument as ADD_IMAGE_TO_COLLECTION,
  AddChannelToCollectionDocument as ADD_CHANNEL_TO_COLLECTION,
  AddDownloadToCollectionDocument as ADD_DOWNLOAD_TO_COLLECTION,
  RemoveDiscussionFromCollectionDocument as REMOVE_DISCUSSION_FROM_COLLECTION,
  RemoveCommentFromCollectionDocument as REMOVE_COMMENT_FROM_COLLECTION,
  RemoveImageFromCollectionDocument as REMOVE_IMAGE_FROM_COLLECTION,
  RemoveChannelFromCollectionDocument as REMOVE_CHANNEL_FROM_COLLECTION,
  RemoveDownloadFromCollectionDocument as REMOVE_DOWNLOAD_FROM_COLLECTION,
  AddFavoriteDiscussionDocument as ADD_FAVORITE_DISCUSSION,
  RemoveFavoriteDiscussionDocument as REMOVE_FAVORITE_DISCUSSION,
  AddFavoriteCommentDocument as ADD_FAVORITE_COMMENT,
  RemoveFavoriteCommentDocument as REMOVE_FAVORITE_COMMENT,
  AddFavoriteImageDocument as ADD_FAVORITE_IMAGE,
  RemoveFavoriteImageDocument as REMOVE_FAVORITE_IMAGE,
  AddFavoriteChannelDocument as ADD_FAVORITE_CHANNEL,
  RemoveFavoriteChannelDocument as REMOVE_FAVORITE_CHANNEL,
} from '@/__generated__/operations';

type ItemType = 'discussion' | 'comment' | 'image' | 'channel' | 'download';

/**
 * Composable that provides collection mutation helpers
 * Handles mapping item types to appropriate GraphQL mutations
 */
export function useCollectionMutations(itemType: ItemType) {
  // Initialize all mutations
  const { mutate: createCollection } = useMutation(CREATE_COLLECTION);
  const { mutate: addDiscussionToCollection } = useMutation(
    ADD_DISCUSSION_TO_COLLECTION
  );
  const { mutate: addCommentToCollection } = useMutation(
    ADD_COMMENT_TO_COLLECTION
  );
  const { mutate: addImageToCollection } = useMutation(ADD_IMAGE_TO_COLLECTION);
  const { mutate: addChannelToCollection } = useMutation(
    ADD_CHANNEL_TO_COLLECTION
  );
  const { mutate: addDownloadToCollection } = useMutation(
    ADD_DOWNLOAD_TO_COLLECTION
  );

  const { mutate: removeDiscussionFromCollection } = useMutation(
    REMOVE_DISCUSSION_FROM_COLLECTION
  );
  const { mutate: removeCommentFromCollection } = useMutation(
    REMOVE_COMMENT_FROM_COLLECTION
  );
  const { mutate: removeImageFromCollection } = useMutation(
    REMOVE_IMAGE_FROM_COLLECTION
  );
  const { mutate: removeChannelFromCollection } = useMutation(
    REMOVE_CHANNEL_FROM_COLLECTION
  );
  const { mutate: removeDownloadFromCollection } = useMutation(
    REMOVE_DOWNLOAD_FROM_COLLECTION
  );

  const { mutate: addFavoriteDiscussion } = useMutation(
    ADD_FAVORITE_DISCUSSION
  );
  const { mutate: removeFavoriteDiscussion } = useMutation(
    REMOVE_FAVORITE_DISCUSSION
  );
  const { mutate: addFavoriteComment } = useMutation(ADD_FAVORITE_COMMENT);
  const { mutate: removeFavoriteComment } = useMutation(
    REMOVE_FAVORITE_COMMENT
  );
  const { mutate: addFavoriteImage } = useMutation(ADD_FAVORITE_IMAGE);
  const { mutate: removeFavoriteImage } = useMutation(REMOVE_FAVORITE_IMAGE);
  const { mutate: addFavoriteChannel } = useMutation(ADD_FAVORITE_CHANNEL);
  const { mutate: removeFavoriteChannel } = useMutation(
    REMOVE_FAVORITE_CHANNEL
  );

  /**
   * Get the appropriate add mutation based on item type
   */
  const getAddMutation = () => {
    const mutationMap = {
      discussion: addDiscussionToCollection,
      comment: addCommentToCollection,
      image: addImageToCollection,
      channel: addChannelToCollection,
      download: addDownloadToCollection,
    };

    return mutationMap[itemType];
  };

  /**
   * Get the appropriate remove mutation based on item type
   */
  const getRemoveMutation = () => {
    const mutationMap = {
      discussion: removeDiscussionFromCollection,
      comment: removeCommentFromCollection,
      image: removeImageFromCollection,
      channel: removeChannelFromCollection,
      download: removeDownloadFromCollection,
    };

    return mutationMap[itemType];
  };

  /**
   * Get the appropriate add favorite mutation based on item type
   */
  // Keep the item discriminator next to its variable shape. Returning a union
  // of Apollo mutate functions loses that relationship at the call site.
  const getAddFavoriteMutation =
    () => (params: { itemId: string; username: string }) => {
      const { itemId, username } = params;
      switch (itemType) {
        case 'channel':
          return addFavoriteChannel({ channel: itemId, username });
        case 'comment':
          return addFavoriteComment({ commentId: itemId, username });
        case 'image':
          return addFavoriteImage({ imageId: itemId, username });
        default:
          return addFavoriteDiscussion({ discussionId: itemId, username });
      }
    };
  const getRemoveFavoriteMutation =
    () => (params: { itemId: string; username: string }) => {
      const { itemId, username } = params;
      switch (itemType) {
        case 'channel':
          return removeFavoriteChannel({ channel: itemId, username });
        case 'comment':
          return removeFavoriteComment({ commentId: itemId, username });
        case 'image':
          return removeFavoriteImage({ imageId: itemId, username });
        default:
          return removeFavoriteDiscussion({ discussionId: itemId, username });
      }
    };

  return {
    createCollection,
    getAddMutation,
    getRemoveMutation,
    getAddFavoriteMutation,
    getRemoveFavoriteMutation,
  };
}

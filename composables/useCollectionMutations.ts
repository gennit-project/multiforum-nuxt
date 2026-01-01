import { useMutation } from '@vue/apollo-composable';
import {
  CREATE_COLLECTION,
  ADD_DISCUSSION_TO_COLLECTION,
  ADD_COMMENT_TO_COLLECTION,
  ADD_IMAGE_TO_COLLECTION,
  ADD_CHANNEL_TO_COLLECTION,
  ADD_DOWNLOAD_TO_COLLECTION,
  REMOVE_DISCUSSION_FROM_COLLECTION,
  REMOVE_COMMENT_FROM_COLLECTION,
  REMOVE_IMAGE_FROM_COLLECTION,
  REMOVE_CHANNEL_FROM_COLLECTION,
  REMOVE_DOWNLOAD_FROM_COLLECTION,
} from '@/graphQLData/collection/mutations';
import {
  ADD_FAVORITE_DISCUSSION,
  REMOVE_FAVORITE_DISCUSSION,
  ADD_FAVORITE_COMMENT,
  REMOVE_FAVORITE_COMMENT,
  ADD_FAVORITE_IMAGE,
  REMOVE_FAVORITE_IMAGE,
  ADD_FAVORITE_CHANNEL,
  REMOVE_FAVORITE_CHANNEL,
} from '@/graphQLData/user/mutations';

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
  const getAddFavoriteMutation = () => {
    const mutationMap = {
      discussion: addFavoriteDiscussion,
      comment: addFavoriteComment,
      image: addFavoriteImage,
      channel: addFavoriteChannel,
      download: addFavoriteDiscussion, // Downloads use the same mutation as discussions
    };

    return mutationMap[itemType];
  };

  /**
   * Get the appropriate remove favorite mutation based on item type
   */
  const getRemoveFavoriteMutation = () => {
    const mutationMap = {
      discussion: removeFavoriteDiscussion,
      comment: removeFavoriteComment,
      image: removeFavoriteImage,
      channel: removeFavoriteChannel,
      download: removeFavoriteDiscussion, // Downloads use the same mutation as discussions
    };

    return mutationMap[itemType];
  };

  return {
    createCollection,
    getAddMutation,
    getRemoveMutation,
    getAddFavoriteMutation,
    getRemoveFavoriteMutation,
  };
}

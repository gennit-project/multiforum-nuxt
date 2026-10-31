import { useQuery, useMutation } from '@vue/apollo-composable';
import {
  GetCollectionItemsDocument,
  GetPublicCollectionByIdDocument,
  GetUserFavoriteImagesDocument,
  ReorderCollectionItemDocument,
  ShareCollectionAsDiscussionDocument,
} from '@/__generated__/operations';
import { useCollectionQueries } from '@/composables/useCollectionQueries';

export function checkCollectionContracts() {
  const detail = useQuery(GetCollectionItemsDocument, { collectionId: 'c1' });
  const publicDetail = useQuery(GetPublicCollectionByIdDocument, {
    collectionId: 'c1',
  });
  const favorites = useQuery(GetUserFavoriteImagesDocument, {
    username: 'alice',
  });
  const reorder = useMutation(ReorderCollectionItemDocument);
  const share = useMutation(ShareCollectionAsDiscussionDocument);
  // @ts-expect-error route arrays must be narrowed to a scalar ID
  detail.refetch({ collectionId: ['c1'] });
  // @ts-expect-error page sizes must be numeric
  publicDetail.refetch({ downloadLimit: '20' });
  // @ts-expect-error reorder position is required and numeric
  reorder.mutate({ collectionId: 'c1', itemId: 'd1', newPosition: 'first' });
  // @ts-expect-error sharing requires a destination server ID
  share.mutate({ collectionId: 'c1', title: 'Title' });
  // @ts-expect-error this selected comment does not include favorite status
  void detail.result.value?.collections[0]?.Comments[0]?.isFavorited;
  // @ts-expect-error favorite images do not select scan state
  void favorites.result.value?.users[0]?.FavoriteImages[0]?.scanStatus;
  const { getCollectionQuery } = useCollectionQueries('image');
  const choices = useQuery(getCollectionQuery(), { username: 'alice' });
  const user = choices.result.value?.users[0];
  if (user && 'FavoriteImages' in user) {
    const imageId: string | undefined = user.FavoriteImages[0]?.id;
    return imageId;
  }
}

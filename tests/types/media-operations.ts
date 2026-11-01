import { useMutation } from '@vue/apollo-composable';
import { CreateImageDocument, UpdateImageMetadataDocument, UpdateDiscussionWithChannelConnectionsDocument } from '@/__generated__/operations';
import { getOrderedAlbumImages } from '@/utils/albumUtils';

export function checkMediaOperationSelections() {
  const create = useMutation(CreateImageDocument);
  // @ts-expect-error image creation requires a URL, not a route array
  create.mutate({ url: ['image.jpg'] });
  const metadata = useMutation(UpdateImageMetadataDocument);
  // @ts-expect-error image IDs are scalar strings
  metadata.mutate({ imageId: ['image-1'], alt: 'A caption' });
  const album = useMutation(UpdateDiscussionWithChannelConnectionsDocument);
  album.mutate({ where: { id: { eq: 'd1' } }, updateDiscussionInput: {}, album: { imageIds: [], imageUpdates: [{ id: 'i1', caption: null }] } });
  // @ts-expect-error the album input requires complete ordered membership
  album.mutate({ where: { id: { eq: 'd1' } }, updateDiscussionInput: {}, album: { imageUpdates: [] } });
  // @ts-expect-error album writes cannot edit URL or ownership fields
  album.mutate({ where: { id: { eq: 'd1' } }, updateDiscussionInput: {}, album: { imageIds: ['i1'], imageUpdates: [{ id: 'i1', url: 'new' }] } });
  const ordered = getOrderedAlbumImages({ album: { Images: [{ id: 'image-1', url: null }] } });
  // @ts-expect-error display helper does not fabricate full schema image permissions
  void ordered[0]?.ChannelConnections;
  return ordered;
}

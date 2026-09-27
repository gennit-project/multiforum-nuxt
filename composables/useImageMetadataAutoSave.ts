import { onBeforeUnmount } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { UPDATE_IMAGE_METADATA } from '@/graphQLData/discussion/mutations';
import type { Image } from '@/__generated__/graphql';

export type ImageMetadata = Pick<Image, 'alt' | 'caption' | 'copyright'>;

type SaveImageMetadataParams = {
  imageId: string;
  metadata: ImageMetadata;
};

const DEBOUNCE_MS = 500;

/**
 * Saves an album image's alt text, caption and attribution directly to the
 * Image as they are edited, debounced per image.
 *
 * Album images exist on the server from the moment they are added, so this
 * works on both the create and edit forms. It replaces relying on the album
 * save, which only connects newly added images and so dropped anything typed
 * for them. Pending saves are flushed on unmount so text typed just before
 * submitting the form is not lost.
 */
export function useImageMetadataAutoSave() {
  const {
    mutate: updateImageMetadata,
    loading: isSavingImageMetadata,
    error: imageMetadataError,
  } = useMutation(UPDATE_IMAGE_METADATA);

  const pending = new Map<string, ImageMetadata>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const flush = (imageId: string) => {
    const timer = timers.get(imageId);
    if (timer) clearTimeout(timer);
    timers.delete(imageId);

    const metadata = pending.get(imageId);
    pending.delete(imageId);
    if (metadata) {
      updateImageMetadata({ imageId, ...metadata });
    }
  };

  const saveImageMetadata = ({
    imageId,
    metadata,
  }: SaveImageMetadataParams) => {
    pending.set(imageId, metadata);
    const timer = timers.get(imageId);
    if (timer) clearTimeout(timer);
    timers.set(
      imageId,
      setTimeout(() => flush(imageId), DEBOUNCE_MS)
    );
  };

  onBeforeUnmount(() => {
    [...pending.keys()].forEach(flush);
  });

  return {
    saveImageMetadata,
    isSavingImageMetadata,
    imageMetadataError,
  };
}

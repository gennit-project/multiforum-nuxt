import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { UPDATE_DISCUSSION } from '@/graphQLData/discussion/mutations';
import type { Album, Image } from '@/__generated__/graphql';

type AlbumFormData = {
  images: {
    id?: string;
    url: string;
    alt: string;
    caption: string;
    copyright: string;
  }[];
  imageOrder: string[];
};

type UseAlbumAutoSaveParams = {
  discussionId: string | undefined;
  existingAlbum: Album | null | undefined;
  getAlbumData: () => AlbumFormData;
};

/**
 * Composable for auto-saving album changes to the server.
 * Handles debounced saves and builds the correct GraphQL update input.
 */
export function useAlbumAutoSave(params: UseAlbumAutoSaveParams) {
  const { discussionId, existingAlbum, getAlbumData } = params;

  // GraphQL Mutation
  const { mutate: updateDiscussion, error: updateDiscussionError } =
    useMutation(UPDATE_DISCUSSION);

  // Auto-save state
  const isAutoSaving = ref(false);
  const autoSaveSuccess = ref(false);
  let autoSaveTimeout: NodeJS.Timeout | null = null;

  /**
   * Build the GraphQL update input for the album.
   * Handles creating new albums or updating existing ones.
   */
  const getAlbumUpdateInput = () => {
    const albumData = getAlbumData();

    if (
      !albumData ||
      (!albumData.images?.length && !albumData.imageOrder?.length)
    ) {
      return {}; // No album data to update
    }

    const albumId = existingAlbum?.id;

    // If the album doesn't exist yet, CREATE it and connect to existing images
    if (!albumId) {
      const newImages = albumData.images || [];
      const validImages = newImages.filter(
        (img): img is (typeof img & { id: string }) => Boolean(img.id)
      );

      if (validImages.length === 0) {
        return {}; // No valid images to connect
      }

      const albumNode: {
        imageOrder: string[];
        Images: {
          connect: { where: { node: { id: string } } }[];
        };
      } = {
        imageOrder: albumData.imageOrder || [],
        Images: {
          connect: validImages.map((img) => ({
            where: { node: { id: img.id } },
          })),
        },
      };

      return {
        Album: {
          create: {
            node: albumNode,
          },
        },
      };
    }

    // If the album already exists, build the connect/update/disconnect arrays
    const oldImages: Image[] = (existingAlbum?.Images as Image[]) ?? [];
    const newImages = albumData.images || [];

    // CONNECT array: new images that need to be connected to this album
    const connectImageArray = newImages
      .filter((img) => img.id && !oldImages.some((old) => old.id === img.id))
      .map((img) => ({
        connect: [
          {
            where: { node: { id: img.id } },
          },
        ],
      }));

    // UPDATE array: existing images that need updates (only if properties changed)
    const updateImageArray = newImages
      .filter((img) => {
        if (!img.id) return false;
        const oldImage = oldImages.find((old) => old.id === img.id);
        if (!oldImage) return false;

        // Only update if properties have actually changed
        return (
          oldImage.url !== img.url ||
          oldImage.alt !== img.alt ||
          oldImage.caption !== img.caption ||
          oldImage.copyright !== img.copyright
        );
      })
      .map((img) => ({
        where: { node: { id: img.id } },
        update: {
          node: {
            url: img.url,
            alt: img.alt,
            caption: img.caption,
            copyright: img.copyright,
          },
        },
      }));

    // DISCONNECT array: old images that are no longer present
    const disconnectImageArray = oldImages
      .filter((old) => !newImages.some((img) => img.id === old.id))
      .map((old) => ({
        disconnect: [
          {
            where: { node: { id: old.id } },
          },
        ],
      }));

    // Combine all operations
    const imagesOps = [
      ...connectImageArray,
      ...updateImageArray,
      ...disconnectImageArray,
    ];

    return {
      Album: {
        update: {
          node: {
            imageOrder: albumData.imageOrder || [],
            Images: imagesOps,
          },
        },
      },
    };
  };

  /**
   * Perform the auto-save operation.
   */
  const performAutoSave = async () => {
    if (!discussionId) {
      return;
    }

    try {
      isAutoSaving.value = true;
      autoSaveSuccess.value = false;

      const albumUpdateInput = getAlbumUpdateInput();

      if (Object.keys(albumUpdateInput).length === 0) {
        return;
      }

      await updateDiscussion({
        where: { id: discussionId },
        updateDiscussionInput: albumUpdateInput,
      });

      autoSaveSuccess.value = true;

      // Hide success indicator after 2 seconds
      setTimeout(() => {
        autoSaveSuccess.value = false;
      }, 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      isAutoSaving.value = false;
    }
  };

  /**
   * Trigger a debounced auto-save.
   * Only saves if we have a discussionId (edit mode).
   */
  const debouncedAutoSave = () => {
    if (!discussionId) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new timeout for debounced save
    autoSaveTimeout = setTimeout(() => {
      performAutoSave();
    }, 500); // 500ms debounce
  };

  return {
    // State
    isAutoSaving,
    autoSaveSuccess,
    updateDiscussionError,

    // Methods
    debouncedAutoSave,
    performAutoSave,
  };
}

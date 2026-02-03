import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import {
  CREATE_SIGNED_STORAGE_URL,
  CREATE_IMAGE,
} from '@/graphQLData/discussion/mutations';
import { usernameVar } from '@/cache';
import { getUploadFileName, uploadAndGetEmbeddedLink } from '@/utils';
import { isFileSizeValid } from '@/utils/index';

export type AlbumImageInput = {
  id?: string;
  url: string;
  alt: string;
  copyright: string;
  caption: string;
};

type UploadedImage = {
  id: string;
  url: string;
  alt: string;
  caption: string;
  copyright: string;
};

type UseAlbumImageUploadParams = {
  maxImages: number;
  currentImageCount: () => number;
  onImageUploaded: (image: UploadedImage) => void;
};

/**
 * Composable for handling image uploads in the album editor.
 * Manages file uploads, signed URLs, and creating image records in the database.
 */
export function useAlbumImageUpload(params: UseAlbumImageUploadParams) {
  const { maxImages, currentImageCount, onImageUploaded } = params;

  // GraphQL Mutations
  const { mutate: createSignedStorageUrl, error: createSignedStorageUrlError } =
    useMutation(CREATE_SIGNED_STORAGE_URL);

  const { mutate: createImage, error: createImageError } =
    useMutation(CREATE_IMAGE);

  // Loading and status state
  const loadingStates = ref<{ [key: number]: boolean }>({});
  const uploadStatus = ref('');

  /**
   * Upload a single file and create an image record in the database.
   * Returns true on success, false on failure.
   */
  const uploadFile = async (file: File): Promise<boolean> => {
    if (!usernameVar.value) {
      console.error('No username found, cannot upload.');
      return false;
    }

    const sizeCheck = isFileSizeValid({ file });
    if (!sizeCheck.valid) {
      alert(sizeCheck.message);
      return false;
    }

    try {
      // Generate a unique filename
      const filename = getUploadFileName({ username: usernameVar.value, file });
      const contentType = file.type;
      const signedStorageURLInput = { filename, contentType };

      // Ask the server for a signed storage URL
      const signedUrlResult = await createSignedStorageUrl(signedStorageURLInput);
      const signedStorageURL = signedUrlResult?.data?.createSignedStorageURL?.url;

      if (!signedStorageURL) {
        throw new Error('No signed storage URL returned');
      }

      // Upload the file using the signed URL
      const fileUrl = await uploadAndGetEmbeddedLink({
        file,
        filename,
        fileType: contentType,
        signedStorageURL,
      });

      if (!fileUrl) {
        throw new Error('No file URL returned from upload');
      }

      // Create the Image record in the database
      // The backend automatically sets the Uploader from the logged-in user's context
      const createImageResult = await createImage({
        url: fileUrl,
        alt: file.name,
        caption: '',
        copyright: '',
      });

      const createdImage = createImageResult?.data?.createImageWithUploader;

      if (!createdImage || !createdImage.id) {
        throw new Error('Failed to create image record in database');
      }

      // Notify parent of the new image
      onImageUploaded({
        id: createdImage.id,
        url: createdImage.url,
        alt: createdImage.alt || file.name,
        caption: createdImage.caption || '',
        copyright: createdImage.copyright || '',
      });

      return true;
    } catch (err) {
      console.error('Error uploading file and creating image:', err);
      return false;
    }
  };

  /**
   * Handle uploading multiple files at once.
   * Processes files sequentially to avoid race conditions.
   */
  const handleMultipleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const currentCount = currentImageCount();
    const remainingSlots = maxImages - currentCount;

    if (remainingSlots <= 0) {
      alert(`You've reached the maximum limit of ${maxImages} images.`);
      return;
    }

    // Limit files to remaining slots
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    if (filesToProcess.length < files.length) {
      alert(
        `You can only add ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}. Maximum limit is ${maxImages} images.`
      );
    }

    if (filesToProcess.length === 0) return;

    loadingStates.value[-1] = true;
    uploadStatus.value = `Uploading 0/${filesToProcess.length} images...`;

    let successCount = 0;
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      if (!file) continue;

      uploadStatus.value = `Uploading ${i + 1}/${filesToProcess.length} images...`;
      const success = await uploadFile(file);
      if (success) successCount++;
    }

    uploadStatus.value = `Successfully uploaded ${successCount} image${successCount !== 1 ? 's' : ''}.`;
    setTimeout(() => {
      uploadStatus.value = '';
    }, 3000);

    loadingStates.value[-1] = false;
  };

  /**
   * Handle file input change event.
   */
  const handleFileInputChange = (
    event: Event,
    allowImageUpload: boolean
  ) => {
    if (!allowImageUpload) return;

    const input = event.target as HTMLInputElement;
    if (!input?.files?.length) return;

    handleMultipleFiles(input.files);

    // Reset the input so user can re-upload the same file if needed
    input.value = '';
  };

  /**
   * Handle drop event for drag-and-drop uploads.
   */
  const handleDrop = async (
    event: DragEvent,
    allowImageUpload: boolean,
    isLimitReached: boolean
  ) => {
    event.preventDefault();

    if (!allowImageUpload) return;
    if (!event.dataTransfer?.files?.length) return;

    if (isLimitReached) {
      alert(`You've reached the maximum limit of ${maxImages} images.`);
      return;
    }

    handleMultipleFiles(event.dataTransfer.files);
  };

  /**
   * Handle dragover event (required to allow drop).
   */
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
  };

  /**
   * Create an image from a URL (without file upload).
   */
  const createImageFromUrl = async (
    url: string
  ): Promise<UploadedImage | null> => {
    if (!usernameVar.value) {
      console.error('No username found, cannot create image.');
      return null;
    }

    try {
      // The backend automatically sets the Uploader from the logged-in user's context
      const createImageResult = await createImage({
        url: url.trim(),
        alt: '',
        caption: '',
        copyright: '',
      });

      const createdImage = createImageResult?.data?.createImageWithUploader;

      if (!createdImage || !createdImage.id) {
        throw new Error('Failed to create image record in database');
      }

      return {
        id: createdImage.id,
        url: createdImage.url,
        alt: createdImage.alt || '',
        caption: createdImage.caption || '',
        copyright: createdImage.copyright || '',
      };
    } catch (err) {
      console.error('Error creating image from URL:', err);
      return null;
    }
  };

  return {
    // State
    loadingStates,
    uploadStatus,
    createSignedStorageUrlError,
    createImageError,

    // Methods
    uploadFile,
    handleMultipleFiles,
    handleFileInputChange,
    handleDrop,
    handleDragOver,
    createImageFromUrl,
  };
}

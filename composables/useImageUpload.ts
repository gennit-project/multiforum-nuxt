import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { CREATE_SIGNED_STORAGE_URL } from '@/graphQLData/discussion/mutations';
import { uploadAndGetEmbeddedLink, getUploadFileName } from '@/utils';
import { usernameVar } from '@/cache';
import { isFileSizeValid } from '@/utils/index';

type UploadResult = {
  success: boolean;
  embeddedLink?: string;
  error?: string;
};

/**
 * Get MIME type from filename extension when browser doesn't provide it
 */
const getFileTypeFromName = (filename: string): string | null => {
  if (!filename) return null;

  const extension = filename.toLowerCase().split('.').pop();
  if (!extension) return null;

  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
  };

  return mimeTypes[extension] || null;
};

/**
 * Composable for handling image uploads in the text editor
 */
export function useImageUpload() {
  const { mutate: createSignedStorageUrl, error: createSignedStorageUrlError } =
    useMutation(CREATE_SIGNED_STORAGE_URL);

  const isUploading = ref(false);

  /**
   * Upload a file to storage and return the embedded link
   */
  const uploadFile = async (file: File): Promise<UploadResult> => {
    if (!usernameVar.value) {
      return {
        success: false,
        error: 'Not logged in or username not found',
      };
    }

    try {
      isUploading.value = true;

      // For mobile devices, ensure the file type is correct even when it's sometimes missing
      const fileType =
        file.type || getFileTypeFromName(file.name) || 'image/jpeg';

      const filename = getUploadFileName({ username: usernameVar.value, file });
      const signedStorageURLInput = { filename, contentType: fileType };

      const signedUrlResult = await createSignedStorageUrl(signedStorageURLInput);
      const signedStorageURL = signedUrlResult?.data?.createSignedStorageURL?.url;

      if (!signedStorageURL) {
        return {
          success: false,
          error: 'Failed to get signed URL for upload',
        };
      }

      const embeddedLink = await uploadAndGetEmbeddedLink({
        file,
        filename,
        fileType,
        signedStorageURL,
      });

      if (!embeddedLink) {
        return {
          success: false,
          error: 'Upload completed but no URL was returned',
        };
      }

      return {
        success: true,
        embeddedLink,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      isUploading.value = false;
    }
  };

  /**
   * Validate file size before upload
   */
  const validateFileSize = (file: File): { valid: boolean; message?: string } => {
    return isFileSizeValid({ file });
  };

  /**
   * Create a placeholder markdown link for an uploading image
   */
  const createUploadPlaceholder = (
    file: File,
    uploadId: string
  ): { markdown: string; placeholderText: string } => {
    const placeholderText = 'Uploading image...';
    const safeFileName = file.name.replace(/[^\w\s.-]/g, '_');
    const markdown = `![${safeFileName}](${placeholderText} (id:${uploadId}))`;
    return { markdown, placeholderText };
  };

  /**
   * Create markdown link for a successfully uploaded image
   */
  const createImageMarkdown = (fileName: string, embeddedLink: string): string => {
    const safeFileName = fileName.replace(/[^\w\s.-]/g, '_');
    return `![${safeFileName}](${embeddedLink})`;
  };

  /**
   * Create markdown link for a failed upload
   */
  const createErrorMarkdown = (fileName: string, errorMessage: string): string => {
    const safeFileName = fileName.replace(/[^\w\s.-]/g, '_');
    return `![Upload failed: ${safeFileName}](Error: ${errorMessage.substring(0, 50)})`;
  };

  /**
   * Create a regex to find a placeholder in text by uploadId
   */
  const createPlaceholderRegex = (placeholderText: string, uploadId: string): RegExp => {
    return new RegExp(
      `!\\[.*?\\]\\(${placeholderText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\(id:${uploadId}\\)\\)`,
      'g'
    );
  };

  return {
    uploadFile,
    validateFileSize,
    createUploadPlaceholder,
    createImageMarkdown,
    createErrorMarkdown,
    createPlaceholderRegex,
    createSignedStorageUrlError,
    isUploading,
  };
}

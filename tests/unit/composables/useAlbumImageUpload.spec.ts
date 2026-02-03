import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAlbumImageUpload } from '@/composables/useAlbumImageUpload';

const mockCreateSignedStorageUrl = vi.fn();
const mockCreateImage = vi.fn();

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (doc: unknown) => {
    // Return different mocks based on the mutation document
    const docString = String(doc);
    if (docString.includes('SIGNED_STORAGE')) {
      return {
        mutate: mockCreateSignedStorageUrl,
        error: { value: null },
      };
    }
    return {
      mutate: mockCreateImage,
      error: { value: null },
    };
  },
}));

vi.mock('@/graphQLData/discussion/mutations', () => ({
  CREATE_SIGNED_STORAGE_URL: Symbol('CREATE_SIGNED_STORAGE_URL'),
  CREATE_IMAGE: Symbol('CREATE_IMAGE'),
}));

vi.mock('@/cache', () => ({
  usernameVar: { value: 'testuser' },
}));

vi.mock('@/utils', () => ({
  getUploadFileName: vi.fn(() => 'test-file-123.jpg'),
  uploadAndGetEmbeddedLink: vi.fn(() => Promise.resolve('https://storage.example.com/test-file-123.jpg')),
}));

vi.mock('@/utils/index', () => ({
  isFileSizeValid: vi.fn(() => ({ valid: true })),
}));

describe('useAlbumImageUpload', () => {
  let onImageUploaded: ReturnType<typeof vi.fn>;
  let currentImageCount: () => number;

  beforeEach(() => {
    mockCreateSignedStorageUrl.mockClear();
    mockCreateImage.mockClear();
    onImageUploaded = vi.fn();
    currentImageCount = () => 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('initializes with empty loading states', () => {
      const { loadingStates } = useAlbumImageUpload({
        maxImages: 25,
        currentImageCount,
        onImageUploaded,
      });

      expect(loadingStates.value).toEqual({});
    });

    it('initializes with empty upload status', () => {
      const { uploadStatus } = useAlbumImageUpload({
        maxImages: 25,
        currentImageCount,
        onImageUploaded,
      });

      expect(uploadStatus.value).toBe('');
    });
  });

  describe('createImageFromUrl', () => {
    it('creates image record and returns image data', async () => {
      mockCreateImage.mockResolvedValue({
        data: {
          createImageWithUploader: {
            id: 'img-123',
            url: 'https://example.com/image.jpg',
            alt: '',
            caption: '',
            copyright: '',
          },
        },
      });

      const { createImageFromUrl } = useAlbumImageUpload({
        maxImages: 25,
        currentImageCount,
        onImageUploaded,
      });

      const result = await createImageFromUrl('https://example.com/image.jpg');

      expect(result).toEqual({
        id: 'img-123',
        url: 'https://example.com/image.jpg',
        alt: '',
        caption: '',
        copyright: '',
      });
    });

    it('returns null when image creation fails', async () => {
      mockCreateImage.mockResolvedValue({
        data: {
          createImageWithUploader: null,
        },
      });

      const { createImageFromUrl } = useAlbumImageUpload({
        maxImages: 25,
        currentImageCount,
        onImageUploaded,
      });

      const result = await createImageFromUrl('https://example.com/image.jpg');

      expect(result).toBeNull();
    });

    it('returns null when mutation throws error', async () => {
      mockCreateImage.mockRejectedValue(new Error('Network error'));

      const { createImageFromUrl } = useAlbumImageUpload({
        maxImages: 25,
        currentImageCount,
        onImageUploaded,
      });

      const result = await createImageFromUrl('https://example.com/image.jpg');

      expect(result).toBeNull();
    });
  });

  describe('handleMultipleFiles', () => {
    it('does nothing when files array is empty', async () => {
      const { handleMultipleFiles } = useAlbumImageUpload({
        maxImages: 25,
        currentImageCount,
        onImageUploaded,
      });

      await handleMultipleFiles([]);

      expect(mockCreateSignedStorageUrl).not.toHaveBeenCalled();
    });

    it('limits files to remaining slots when near max', async () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

      currentImageCount = () => 24; // 1 slot remaining

      const { handleMultipleFiles } = useAlbumImageUpload({
        maxImages: 25,
        currentImageCount,
        onImageUploaded,
      });

      const files = [
        new File(['content1'], 'file1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'file2.jpg', { type: 'image/jpeg' }),
        new File(['content3'], 'file3.jpg', { type: 'image/jpeg' }),
      ];

      // Mock successful upload flow
      mockCreateSignedStorageUrl.mockResolvedValue({
        data: { createSignedStorageURL: { url: 'https://signed-url.example.com' } },
      });
      mockCreateImage.mockResolvedValue({
        data: {
          createImageWithUploader: {
            id: 'img-1',
            url: 'https://example.com/1.jpg',
            alt: 'file1.jpg',
            caption: '',
            copyright: '',
          },
        },
      });

      await handleMultipleFiles(files);

      // Should show alert about limit
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('You can only add 1 more image')
      );

      alertMock.mockRestore();
    });

    it('alerts when at max capacity', async () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

      currentImageCount = () => 25; // At max

      const { handleMultipleFiles } = useAlbumImageUpload({
        maxImages: 25,
        currentImageCount,
        onImageUploaded,
      });

      const files = [new File(['content'], 'file.jpg', { type: 'image/jpeg' })];

      await handleMultipleFiles(files);

      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining("You've reached the maximum limit of 25 images")
      );
      expect(mockCreateSignedStorageUrl).not.toHaveBeenCalled();

      alertMock.mockRestore();
    });
  });

  describe('handleDrop', () => {
    it('prevents default on drop event', async () => {
      const { handleDrop } = useAlbumImageUpload({
        maxImages: 25,
        currentImageCount,
        onImageUploaded,
      });

      const preventDefault = vi.fn();
      const event = {
        preventDefault,
        dataTransfer: { files: [] },
      } as unknown as DragEvent;

      await handleDrop(event, true, false);

      expect(preventDefault).toHaveBeenCalled();
    });

    it('does nothing when allowImageUpload is false', async () => {
      const { handleDrop } = useAlbumImageUpload({
        maxImages: 25,
        currentImageCount,
        onImageUploaded,
      });

      const event = {
        preventDefault: vi.fn(),
        dataTransfer: {
          files: [new File(['content'], 'file.jpg', { type: 'image/jpeg' })],
        },
      } as unknown as DragEvent;

      await handleDrop(event, false, false);

      expect(mockCreateSignedStorageUrl).not.toHaveBeenCalled();
    });

    it('alerts when limit is reached on drop', async () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const { handleDrop } = useAlbumImageUpload({
        maxImages: 25,
        currentImageCount,
        onImageUploaded,
      });

      const event = {
        preventDefault: vi.fn(),
        dataTransfer: {
          files: [new File(['content'], 'file.jpg', { type: 'image/jpeg' })],
        },
      } as unknown as DragEvent;

      await handleDrop(event, true, true); // isLimitReached = true

      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('maximum limit of 25 images')
      );

      alertMock.mockRestore();
    });
  });

  describe('handleDragOver', () => {
    it('prevents default to allow drop', () => {
      const { handleDragOver } = useAlbumImageUpload({
        maxImages: 25,
        currentImageCount,
        onImageUploaded,
      });

      const preventDefault = vi.fn();
      const event = { preventDefault } as unknown as DragEvent;

      handleDragOver(event);

      expect(preventDefault).toHaveBeenCalled();
    });
  });
});

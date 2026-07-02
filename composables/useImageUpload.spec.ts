import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMutation } from '@vue/apollo-composable';
import { useImageUpload } from './useImageUpload';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
}));

const { usernameRef } = vi.hoisted(() => ({
  usernameRef: { value: 'alice' as string },
}));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => usernameRef,
}));

const { uploadAndGetEmbeddedLink, getUploadFileName, isFileSizeValid } =
  vi.hoisted(() => ({
    uploadAndGetEmbeddedLink: vi.fn(),
    getUploadFileName: vi.fn(() => 'alice-123.jpg'),
    // Seed the full {valid, message} shape so later mockReturnValue calls that
    // include `message` stay within the inferred return type.
    isFileSizeValid: vi.fn(() => ({ valid: true, message: '' })),
  }));
// `@/utils` and `@/utils/index` resolve to the same module, so both mocks must
// expose every export this composable imports from either specifier.
vi.mock('@/utils', () => ({
  uploadAndGetEmbeddedLink,
  getUploadFileName,
  isFileSizeValid,
}));
vi.mock('@/utils/index', () => ({
  uploadAndGetEmbeddedLink,
  getUploadFileName,
  isFileSizeValid,
}));

const mockMutate = vi.fn();
const makeFile = (name = 'pic.png', type = 'image/png') =>
  new File(['x'], name, { type });

beforeEach(() => {
  vi.clearAllMocks();
  usernameRef.value = 'alice';
  (useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    mutate: mockMutate,
    error: { value: null },
  });
  getUploadFileName.mockReturnValue('alice-123.jpg');
  isFileSizeValid.mockReturnValue({ valid: true, message: '' });
});

describe('useImageUpload.uploadFile', () => {
  it('fails when there is no logged-in username', async () => {
    usernameRef.value = '';
    const { uploadFile } = useImageUpload();
    const result = await uploadFile(makeFile());
    expect(result).toEqual({
      success: false,
      error: 'Not logged in or username not found',
    });
  });

  it('fails when no signed URL is returned', async () => {
    mockMutate.mockResolvedValue({ data: { createSignedStorageURL: { url: '' } } });
    const { uploadFile } = useImageUpload();
    const result = await uploadFile(makeFile());
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/signed URL/i);
  });

  it('fails when the upload returns no embedded link', async () => {
    mockMutate.mockResolvedValue({
      data: { createSignedStorageURL: { url: 'https://signed' } },
    });
    uploadAndGetEmbeddedLink.mockResolvedValue('');
    const { uploadFile } = useImageUpload();
    const result = await uploadFile(makeFile());
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/no URL/i);
  });

  it('returns the embedded link on success and toggles isUploading', async () => {
    mockMutate.mockResolvedValue({
      data: { createSignedStorageURL: { url: 'https://signed' } },
    });
    uploadAndGetEmbeddedLink.mockResolvedValue('https://cdn/pic.png');
    const { uploadFile, isUploading } = useImageUpload();

    const promise = uploadFile(makeFile());
    expect(isUploading.value).toBe(true);
    const result = await promise;

    expect(result).toEqual({ success: true, embeddedLink: 'https://cdn/pic.png' });
    expect(isUploading.value).toBe(false);
  });

  it('derives a content type from the filename when file.type is missing', async () => {
    mockMutate.mockResolvedValue({
      data: { createSignedStorageURL: { url: 'https://signed' } },
    });
    uploadAndGetEmbeddedLink.mockResolvedValue('https://cdn/x.webp');
    const { uploadFile } = useImageUpload();

    await uploadFile(makeFile('x.webp', '')); // no MIME type
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'image/webp' })
    );
  });

  it('passes channel connections from the option callback', async () => {
    mockMutate.mockResolvedValue({
      data: { createSignedStorageURL: { url: 'https://signed' } },
    });
    uploadAndGetEmbeddedLink.mockResolvedValue('https://cdn/x.png');
    const { uploadFile } = useImageUpload({
      getChannelConnections: () => ['cats', 'dogs'],
    });

    await uploadFile(makeFile());
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ channelConnections: ['cats', 'dogs'] })
    );
  });

  it('passes the server storageUrl to the storage upload helper', async () => {
    mockMutate.mockResolvedValue({
      data: {
        createSignedStorageURL: {
          url: 'https://signed',
          storageUrl: 'https://storage.googleapis.com/bucket/users/alice/x.png',
        },
      },
    });
    uploadAndGetEmbeddedLink.mockResolvedValue('https://cdn/x.png');
    const { uploadFile } = useImageUpload();

    await uploadFile(makeFile());

    expect(uploadAndGetEmbeddedLink).toHaveBeenCalledWith(
      expect.objectContaining({
        storageUrl: 'https://storage.googleapis.com/bucket/users/alice/x.png',
      })
    );
  });

  it('returns the error message when the upload throws', async () => {
    mockMutate.mockRejectedValue(new Error('network down'));
    const { uploadFile, isUploading } = useImageUpload();
    const result = await uploadFile(makeFile());
    expect(result).toEqual({ success: false, error: 'network down' });
    expect(isUploading.value).toBe(false);
  });
});

describe('useImageUpload helpers', () => {
  it('validateFileSize delegates to isFileSizeValid', () => {
    isFileSizeValid.mockReturnValue({ valid: false, message: 'too big' });
    const { validateFileSize } = useImageUpload();
    expect(validateFileSize(makeFile())).toEqual({ valid: false, message: 'too big' });
  });

  it('createUploadPlaceholder sanitizes the filename and embeds the id', () => {
    const { createUploadPlaceholder } = useImageUpload();
    const { markdown, placeholderText } = createUploadPlaceholder(
      makeFile('my pic!.png'),
      'up1'
    );
    expect(placeholderText).toBe('Uploading image...');
    expect(markdown).toBe('![my pic_.png](Uploading image... (id:up1))');
  });

  it('createImageMarkdown sanitizes the filename', () => {
    const { createImageMarkdown } = useImageUpload();
    expect(createImageMarkdown('a*b.png', 'https://cdn/a.png')).toBe(
      '![a_b.png](https://cdn/a.png)'
    );
  });

  it('createErrorMarkdown truncates the error to 50 chars', () => {
    const { createErrorMarkdown } = useImageUpload();
    const long = 'e'.repeat(80);
    const md = createErrorMarkdown('x.png', long);
    expect(md).toContain('Upload failed: x.png');
    expect(md).toContain(`Error: ${'e'.repeat(50)}`);
    expect(md).not.toContain('e'.repeat(51));
  });

  it('createPlaceholderRegex matches the placeholder it was built from', () => {
    const { createUploadPlaceholder, createPlaceholderRegex } = useImageUpload();
    const { markdown, placeholderText } = createUploadPlaceholder(makeFile(), 'abc');
    const re = createPlaceholderRegex(placeholderText, 'abc');
    expect(re.test(markdown)).toBe(true);
  });
});

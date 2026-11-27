import { onTestFinished, vi } from 'vitest';
import type * as Utils from '@/utils';

const signedUrl = 'https://storage.test/signed-upload';
const storageUrl = 'https://storage.test/uploaded-file';
const sizeRange = '0,10485760';

export async function stubSignedUpload(
  sign: ReturnType<typeof vi.fn>,
  upload: ReturnType<typeof vi.fn>
) {
  sign.mockResolvedValueOnce({
    data: {
      createSignedStorageURL: {
        url: signedUrl,
        storageUrl,
        contentLengthRange: sizeRange,
      },
    },
  });
  const { uploadAndGetEmbeddedLink } =
    await vi.importActual<typeof Utils>('@/utils');
  upload.mockImplementationOnce(uploadAndGetEmbeddedLink);
  const fetchSpy = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(null, { status: 200 }));
  onTestFinished(() => fetchSpy.mockRestore());

  return {
    recordedRequest: () => ({
      signedContentType: sign.mock.calls.at(-1)?.[0]?.contentType,
      put: fetchSpy.mock.calls,
    }),
    expectedRequest: (file: File, contentType: string) => ({
      signedContentType: contentType,
      put: [
        [
          signedUrl,
          {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': contentType,
              'x-goog-content-length-range': sizeRange,
            },
          },
        ],
      ],
    }),
  };
}

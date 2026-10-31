import { FileKind } from '@/__generated__/graphql';
import type {
  DiscussionUpdateInput,
  DiscussionDownloadableFilesConnectFieldInput,
  DiscussionDownloadableFilesDisconnectFieldInput,
  DiscussionDownloadableFilesUpdateFieldInput,
} from '@/__generated__/graphql';

/**
 * Pure helpers for the download edit form
 * (components/discussion/form/DownloadEditForm.vue). Extracted from the
 * component so the mime/kind/accept/update-input logic is unit-testable.
 */

const DOWNLOAD_MIME_TYPES: Record<string, string> = {
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  exe: 'application/x-msdownload',
  dmg: 'application/x-apple-diskimage',
  pkg: 'application/x-newton-compatible-pkg',
  deb: 'application/vnd.debian.binary-package',
  rpm: 'application/x-rpm',
};

/**
 * Guess a MIME type from a file name. Returns `null` when there is no name or
 * extension, and `application/octet-stream` for unknown extensions.
 */
export function getDownloadFileMimeType(filename: string): string | null {
  if (!filename) return null;
  const extension = filename.toLowerCase().split('.').pop();
  if (!extension) return null;
  return DOWNLOAD_MIME_TYPES[extension] || 'application/octet-stream';
}

/** Map a file name to a FileKind enum value (ZIP/RAR/PNG/.../OTHER). */
export function getDownloadFileKind(filename: string): FileKind {
  const extension = filename.toLowerCase().split('.').pop();
  if (extension === 'zip') return FileKind.Zip;
  if (extension === 'rar') return FileKind.Rar;
  if (extension === 'png') return FileKind.Png;
  if (['jpg', 'jpeg'].includes(extension || '')) return FileKind.Jpg;
  if (extension === 'blend') return FileKind.Blend;
  if (extension === 'stl') return FileKind.Stl;
  if (extension === 'glb') return FileKind.Glb;
  return FileKind.Other;
}

/**
 * Build the `accept` attribute for the file input from a channel's allowed file
 * types. Returns `undefined` when there is no restriction.
 */
export function buildDownloadAcceptAttribute(
  allowedFileTypes: string[] | null | undefined
): string | undefined {
  const allowedTypes = allowedFileTypes || [];
  if (allowedTypes.length === 0) {
    return undefined;
  }
  const extensions = allowedTypes.map((type) => {
    const lowerType = type.toLowerCase();
    return lowerType.startsWith('.') ? lowerType : `.${lowerType}`;
  });
  return extensions.join(',');
}

type FileRef = { id?: string | null };

/**
 * Build the discussion update input that connects newly added downloadable
 * files and disconnects removed ones, mirroring the create-vs-update branching
 * of the form. Only files with database IDs are connected.
 */
export function buildDownloadableFilesUpdateInput(params: {
  originalFiles: FileRef[] | null | undefined;
  currentFiles: FileRef[] | null | undefined;
}): DiscussionUpdateInput {
  const originalFiles = params.originalFiles ?? [];
  const currentFiles = params.currentFiles ?? [];

  // No pre-existing files: only build a connect array.
  if (originalFiles.length === 0) {
    const connectArray: DiscussionDownloadableFilesConnectFieldInput[] =
      currentFiles
        .filter((file) => file.id)
        .map((file) => ({ where: { node: { id: { eq: file.id } } } }));

    return {
      hasDownload: { set: currentFiles.length > 0 },
      DownloadableFiles:
        connectArray.length > 0 ? [{ connect: connectArray }] : undefined,
    };
  }

  // Connect new files that aren't already linked.
  const connectArray: DiscussionDownloadableFilesConnectFieldInput[] =
    currentFiles
      .filter(
        (file) => file.id && !originalFiles.some((old) => old.id === file.id)
      )
      .map((file) => ({ where: { node: { id: { eq: file.id } } } }));

  // Disconnect old files no longer present.
  const disconnectArray: DiscussionDownloadableFilesDisconnectFieldInput[] =
    originalFiles
      .filter((old) => !currentFiles.some((file) => file.id === old.id))
      .map((old) => ({ where: { node: { id: { eq: old.id } } } }));

  const updateFieldInput: DiscussionDownloadableFilesUpdateFieldInput = {};
  if (connectArray.length > 0) {
    updateFieldInput.connect = connectArray;
  }
  if (disconnectArray.length > 0) {
    updateFieldInput.disconnect = disconnectArray;
  }

  return {
    hasDownload: { set: currentFiles.length > 0 },
    DownloadableFiles:
      Object.keys(updateFieldInput).length > 0 ? [updateFieldInput] : undefined,
  };
}

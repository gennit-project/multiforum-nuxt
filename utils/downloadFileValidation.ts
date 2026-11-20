/**
 * Pure file-validation helpers for the download upload form, extracted from
 * DownloadEditForm. They take primitive file fields (name/type/size) rather
 * than a File object so they can be unit-tested without the DOM.
 */
export type FileValidationResult = { valid: boolean; message: string };

export type ValidateFileTypeParams = {
  fileName: string;
  fileType: string;
  allowedFileTypes: string[];
  downloadsDisabled: boolean;
};

export function validateDownloadFileType(
  params: ValidateFileTypeParams
): FileValidationResult {
  const { fileName, fileType, allowedFileTypes, downloadsDisabled } = params;

  if (downloadsDisabled) {
    return { valid: false, message: 'Downloads are disabled in this channel.' };
  }

  if (allowedFileTypes.length === 0) {
    return { valid: true, message: '' };
  }

  const fileExtension = fileName.toLowerCase().split('.').pop();
  const isAllowed = allowedFileTypes.some(
    (type) =>
      type.toLowerCase().includes(fileExtension || '') ||
      fileType.toLowerCase().includes(type.toLowerCase())
  );

  if (!isAllowed) {
    return {
      valid: false,
      message: `File type not allowed. Allowed types: ${allowedFileTypes.join(', ')}`,
    };
  }

  return { valid: true, message: '' };
}

import { describe, it, expect } from 'vitest';
import {
  validateDownloadFileType,
  validateDownloadFileSize,
  MAX_DOWNLOAD_FILE_SIZE_BYTES,
} from '@/utils/downloadFileValidation';

describe('validateDownloadFileType', () => {
  it('rejects when downloads are disabled', () => {
    expect(
      validateDownloadFileType({
        fileName: 'a.stl',
        fileType: 'model/stl',
        allowedFileTypes: ['stl'],
        downloadsDisabled: true,
      }).valid
    ).toBe(false);
  });

  it('allows any type when no allow-list is configured', () => {
    expect(
      validateDownloadFileType({
        fileName: 'a.xyz',
        fileType: 'application/xyz',
        allowedFileTypes: [],
        downloadsDisabled: false,
      }).valid
    ).toBe(true);
  });

  it('allows a file whose extension is in the allow-list', () => {
    expect(
      validateDownloadFileType({
        fileName: 'model.stl',
        fileType: 'application/octet-stream',
        allowedFileTypes: ['stl'],
        downloadsDisabled: false,
      }).valid
    ).toBe(true);
  });

  it('rejects a file whose type is not in the allow-list', () => {
    const result = validateDownloadFileType({
      fileName: 'doc.pdf',
      fileType: 'application/pdf',
      allowedFileTypes: ['stl'],
      downloadsDisabled: false,
    });
    expect(result.valid).toBe(false);
  });

  it('lists the allowed types in the rejection message', () => {
    const result = validateDownloadFileType({
      fileName: 'doc.pdf',
      fileType: 'application/pdf',
      allowedFileTypes: ['stl', 'obj'],
      downloadsDisabled: false,
    });
    expect(result.message).toContain('stl, obj');
  });
});

describe('validateDownloadFileSize', () => {
  it('accepts a file within the size limit', () => {
    expect(validateDownloadFileSize(1024).valid).toBe(true);
  });

  it('rejects a file over the size limit', () => {
    expect(
      validateDownloadFileSize(MAX_DOWNLOAD_FILE_SIZE_BYTES + 1).valid
    ).toBe(false);
  });

  it('reports the file size in the rejection message', () => {
    expect(
      validateDownloadFileSize(MAX_DOWNLOAD_FILE_SIZE_BYTES + 1).message
    ).toContain('less than 50MB');
  });
});

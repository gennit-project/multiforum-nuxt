import { describe, it, expect } from 'vitest';
import {
  validateDownloadFileType,
} from './downloadFileValidation';

describe('validateDownloadFileType', () => {
  const base = {
    fileName: 'model.stl',
    fileType: 'application/octet-stream',
    allowedFileTypes: ['stl'],
    downloadsDisabled: false,
  };

  it('rejects when downloads are disabled', () => {
    expect(
      validateDownloadFileType({ ...base, downloadsDisabled: true }).message
    ).toBe('Downloads are disabled in this channel.');
  });

  it('allows any type when there is no restriction', () => {
    expect(
      validateDownloadFileType({ ...base, allowedFileTypes: [] }).valid
    ).toBe(true);
  });

  it('allows a file whose extension is in the allow-list', () => {
    expect(validateDownloadFileType(base).valid).toBe(true);
  });

  it('rejects a file whose extension is not allowed', () => {
    expect(
      validateDownloadFileType({ ...base, fileName: 'doc.pdf', allowedFileTypes: ['stl'] })
        .valid
    ).toBe(false);
  });
});

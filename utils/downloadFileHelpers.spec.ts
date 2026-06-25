import { describe, it, expect } from 'vitest';
import {
  getDownloadFileMimeType,
  getDownloadFileKind,
  buildDownloadAcceptAttribute,
  buildDownloadableFilesUpdateInput,
} from './downloadFileHelpers';

describe('getDownloadFileMimeType', () => {
  it('maps a known extension to its MIME type', () => {
    expect(getDownloadFileMimeType('archive.zip')).toBe('application/zip');
  });

  it('returns octet-stream for an unknown extension', () => {
    expect(getDownloadFileMimeType('file.xyz')).toBe('application/octet-stream');
  });

  it('returns null when there is no name', () => {
    expect(getDownloadFileMimeType('')).toBeNull();
  });
});

describe('getDownloadFileKind', () => {
  it.each([
    ['model.stl', 'STL'],
    ['photo.JPG', 'JPG'],
    ['art.png', 'PNG'],
    ['pack.zip', 'ZIP'],
    ['notes.txt', 'OTHER'],
  ])('classifies %s as %s', (name, kind) => {
    expect(getDownloadFileKind(name)).toBe(kind);
  });
});

describe('buildDownloadAcceptAttribute', () => {
  it('returns undefined when there is no restriction', () => {
    expect(buildDownloadAcceptAttribute([])).toBeUndefined();
  });

  it('builds a dot-prefixed comma list', () => {
    expect(buildDownloadAcceptAttribute(['zip', '.stl'])).toBe('.zip,.stl');
  });
});

describe('buildDownloadableFilesUpdateInput', () => {
  it('connects all current files when there were none before', () => {
    const result = buildDownloadableFilesUpdateInput({
      originalFiles: [],
      currentFiles: [{ id: 'f1' }],
    });
    expect(result.DownloadableFiles).toEqual([
      { connect: [{ where: { node: { id: 'f1' } } }] },
    ]);
  });

  it('sets hasDownload false when there are no files', () => {
    expect(
      buildDownloadableFilesUpdateInput({ originalFiles: [], currentFiles: [] })
        .hasDownload
    ).toBe(false);
  });

  it('connects new files and disconnects removed ones for an existing set', () => {
    const result = buildDownloadableFilesUpdateInput({
      originalFiles: [{ id: 'f1' }],
      currentFiles: [{ id: 'f2' }],
    });
    expect(result.DownloadableFiles).toEqual([
      {
        connect: [{ where: { node: { id: 'f2' } } }],
        disconnect: [{ where: { node: { id: 'f1' } } }],
      },
    ]);
  });
});

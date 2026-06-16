import { describe, it, expect } from 'vitest';
import {
  getDownloadFileMimeType,
  getDownloadFileKind,
  buildDownloadAcceptAttribute,
  buildDownloadableFilesUpdateInput,
} from '@/utils/downloadFileHelpers';

describe('getDownloadFileMimeType', () => {
  it('returns null for an empty name', () => {
    expect(getDownloadFileMimeType('')).toBeNull();
  });

  it('maps a known extension to its mime type', () => {
    expect(getDownloadFileMimeType('archive.zip')).toBe('application/zip');
  });

  it('is case-insensitive', () => {
    expect(getDownloadFileMimeType('Model.STL'.replace('STL', 'PDF'))).toBe('application/pdf');
  });

  it('falls back to octet-stream for unknown extensions', () => {
    expect(getDownloadFileMimeType('file.xyz')).toBe('application/octet-stream');
  });
});

describe('getDownloadFileKind', () => {
  it.each([
    ['model.zip', 'ZIP'],
    ['model.rar', 'RAR'],
    ['pic.png', 'PNG'],
    ['pic.jpeg', 'JPG'],
    ['pic.jpg', 'JPG'],
    ['model.blend', 'BLEND'],
    ['model.stl', 'STL'],
    ['model.glb', 'GLB'],
    ['notes.txt', 'OTHER'],
  ])('maps %s to %s', (filename, kind) => {
    expect(getDownloadFileKind(filename)).toBe(kind);
  });
});

describe('buildDownloadAcceptAttribute', () => {
  it('returns undefined when no types are allowed', () => {
    expect(buildDownloadAcceptAttribute([])).toBeUndefined();
  });

  it('returns undefined for nullish input', () => {
    expect(buildDownloadAcceptAttribute(null)).toBeUndefined();
  });

  it('prefixes bare extensions with a dot', () => {
    expect(buildDownloadAcceptAttribute(['zip', 'stl'])).toBe('.zip,.stl');
  });

  it('leaves already-dotted extensions untouched', () => {
    expect(buildDownloadAcceptAttribute(['.zip', 'STL'])).toBe('.zip,.stl');
  });
});

describe('buildDownloadableFilesUpdateInput', () => {
  it('connects new files when there are no original files', () => {
    const result = buildDownloadableFilesUpdateInput({
      originalFiles: [],
      currentFiles: [{ id: 'f1' }, { id: 'f2' }],
    });
    expect(result.DownloadableFiles).toEqual([
      { connect: [{ where: { node: { id: 'f1' } } }, { where: { node: { id: 'f2' } } }] },
    ]);
  });

  it('sets hasDownload false when there are no files at all', () => {
    const result = buildDownloadableFilesUpdateInput({ originalFiles: [], currentFiles: [] });
    expect(result.hasDownload).toBe(false);
  });

  it('omits DownloadableFiles when no files have ids', () => {
    const result = buildDownloadableFilesUpdateInput({
      originalFiles: [],
      currentFiles: [{ id: null }],
    });
    expect(result.DownloadableFiles).toBeUndefined();
  });

  it('connects only newly added files when originals exist', () => {
    const result = buildDownloadableFilesUpdateInput({
      originalFiles: [{ id: 'f1' }],
      currentFiles: [{ id: 'f1' }, { id: 'f2' }],
    });
    expect(result.DownloadableFiles).toEqual([
      { connect: [{ where: { node: { id: 'f2' } } }] },
    ]);
  });

  it('disconnects files removed from the current set', () => {
    const result = buildDownloadableFilesUpdateInput({
      originalFiles: [{ id: 'f1' }, { id: 'f2' }],
      currentFiles: [{ id: 'f1' }],
    });
    expect(result.DownloadableFiles).toEqual([
      { disconnect: [{ where: { node: { id: 'f2' } } }] },
    ]);
  });

  it('omits DownloadableFiles when the set is unchanged', () => {
    const result = buildDownloadableFilesUpdateInput({
      originalFiles: [{ id: 'f1' }],
      currentFiles: [{ id: 'f1' }],
    });
    expect(result.DownloadableFiles).toBeUndefined();
  });
});

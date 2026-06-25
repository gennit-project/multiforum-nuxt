import { describe, it, expect } from 'vitest';
import { buildAlbumUpdateInput } from './albumUpdateInput';

describe('buildAlbumUpdateInput', () => {
  it('returns an empty object when there is no album data', () => {
    expect(buildAlbumUpdateInput({ albumData: null })).toEqual({});
  });

  it('creates a new album connecting existing images when none exists yet', () => {
    const result = buildAlbumUpdateInput({
      albumData: { images: [{ id: 'i1' }], imageOrder: ['i1'] },
    });
    expect(result.Album?.create?.node?.Images?.connect).toEqual([
      { where: { node: { id: 'i1' } } },
    ]);
  });

  it('returns an empty object when creating with no valid image ids', () => {
    expect(
      buildAlbumUpdateInput({ albumData: { images: [{ url: 'x' }] } })
    ).toEqual({});
  });

  it('connects images that are new to an existing album', () => {
    const result = buildAlbumUpdateInput({
      albumData: { images: [{ id: 'i2' }] },
      existingAlbumId: 'a1',
      existingImages: [{ id: 'i1' }],
    });
    expect(result.Album?.update?.node?.Images).toContainEqual({
      connect: [{ where: { node: { id: 'i2' } } }],
    });
  });

  it('disconnects images removed from an existing album', () => {
    const result = buildAlbumUpdateInput({
      albumData: { images: [], imageOrder: ['x'] },
      existingAlbumId: 'a1',
      existingImages: [{ id: 'i1' }],
    });
    expect(result.Album?.update?.node?.Images).toContainEqual({
      disconnect: [{ where: { node: { id: 'i1' } } }],
    });
  });
});

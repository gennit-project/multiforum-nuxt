import { describe, it, expect } from 'vitest';
import { buildAlbumUpdateInput } from '@/utils/albumUpdateInput';

describe('buildAlbumUpdateInput', () => {
  it('returns an empty object when there is no album data', () => {
    expect(buildAlbumUpdateInput({ albumData: null })).toEqual({});
  });

  it('returns an empty object when album has no images and no order', () => {
    expect(
      buildAlbumUpdateInput({ albumData: { images: [], imageOrder: [] } })
    ).toEqual({});
  });

  describe('creating a new album', () => {
    it('connects valid images under Album.create', () => {
      const result = buildAlbumUpdateInput({
        albumData: { images: [{ id: 'img1' }, { id: 'img2' }], imageOrder: ['img1', 'img2'] },
        existingAlbumId: null,
      });
      expect(result).toEqual({
        Album: {
          create: {
            node: {
              imageOrder: ['img1', 'img2'],
              Images: {
                connect: [
                  { where: { node: { id: 'img1' } } },
                  { where: { node: { id: 'img2' } } },
                ],
              },
            },
          },
        },
      });
    });

    it('returns an empty object when no images have ids', () => {
      expect(
        buildAlbumUpdateInput({
          albumData: { images: [{ id: null }], imageOrder: ['x'] },
          existingAlbumId: null,
        })
      ).toEqual({});
    });
  });

  describe('updating an existing album', () => {
    it('connects newly added images', () => {
      const result = buildAlbumUpdateInput({
        albumData: { images: [{ id: 'old1' }, { id: 'new1' }] },
        existingAlbumId: 'album-1',
        existingImages: [{ id: 'old1' }],
      });
      const ops = (result as { Album: { update: { node: { Images: unknown[] } } } }).Album.update.node.Images;
      expect(ops).toContainEqual({ connect: [{ where: { node: { id: 'new1' } } }] });
    });

    it('updates images that already exist', () => {
      const result = buildAlbumUpdateInput({
        albumData: { images: [{ id: 'old1', alt: 'new alt', url: 'u', caption: 'c', copyright: 'r' }] },
        existingAlbumId: 'album-1',
        existingImages: [{ id: 'old1' }],
      });
      const ops = (result as { Album: { update: { node: { Images: unknown[] } } } }).Album.update.node.Images;
      expect(ops).toContainEqual({
        where: { node: { id: 'old1' } },
        update: { node: { url: 'u', alt: 'new alt', caption: 'c', copyright: 'r' } },
      });
    });

    it('disconnects images no longer present', () => {
      const result = buildAlbumUpdateInput({
        albumData: { images: [{ id: 'keep' }] },
        existingAlbumId: 'album-1',
        existingImages: [{ id: 'keep' }, { id: 'gone' }],
      });
      const ops = (result as { Album: { update: { node: { Images: unknown[] } } } }).Album.update.node.Images;
      expect(ops).toContainEqual({ disconnect: [{ where: { node: { id: 'gone' } } }] });
    });

    it('carries through the image order', () => {
      const result = buildAlbumUpdateInput({
        albumData: { images: [{ id: 'a' }], imageOrder: ['a', 'b'] },
        existingAlbumId: 'album-1',
        existingImages: [{ id: 'a' }],
      });
      const order = (result as { Album: { update: { node: { imageOrder: string[] } } } }).Album.update.node.imageOrder;
      expect(order).toEqual(['a', 'b']);
    });
  });
});

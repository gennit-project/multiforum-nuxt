import { describe, it, expect } from 'vitest';
import { buildAlbumUpdateInput } from './albumUpdateInput';

describe('buildAlbumUpdateInput', () => {
  it('omits absent album data', () => {
    expect(buildAlbumUpdateInput({ albumData: null })).toBeUndefined();
  });
  it('normalizes complete unique ordered membership', () => {
    expect(buildAlbumUpdateInput({ albumData: { images: [{ id: 'a' }, { id: 'b' }, { id: 'a' }, { url: 'pending' }], imageOrder: ['b', 'b', 'missing'] } })).toEqual({ imageIds: ['b', 'a'] });
  });
  it('omits empty and whitespace image IDs from membership', () => {
    expect(buildAlbumUpdateInput({ albumData: { images: [{ id: '' }, { id: ' ' }, { id: 'valid' }], imageOrder: ['', ' ', 'valid'] } })).toEqual({ imageIds: ['valid'] });
  });
  it('clears existing membership explicitly', () => {
    expect(buildAlbumUpdateInput({ albumData: { images: [] }, existingImages: [{ id: 'a' }] })).toEqual({ imageIds: [] });
  });
  it('omits unchanged foreign image metadata normalized by form fields', () => {
    expect(buildAlbumUpdateInput({ albumData: { images: [{ id: 'a', alt: '', caption: 'original', copyright: '' }] }, existingImages: [{ id: 'a', alt: null, caption: 'original', copyright: null }] })).toBeUndefined();
  });
  it('sends only changed metadata and explicit null clears', () => {
    expect(buildAlbumUpdateInput({ albumData: { images: [{ id: 'a', url: 'not-editable', alt: 'new', caption: null }] }, existingImages: [{ id: 'a', url: 'old', alt: 'old', caption: 'clear me' }] })).toEqual({ imageIds: ['a'], imageUpdates: [{ id: 'a', alt: 'new', caption: null }] });
  });
  it('does not rewrite metadata for newly reused images', () => {
    expect(buildAlbumUpdateInput({ albumData: { images: [{ id: 'reused', alt: 'existing attribution', copyright: 'other owner' }] } })).toEqual({ imageIds: ['reused'] });
  });
  it('preserves a reorder without rewriting unchanged metadata', () => {
    expect(buildAlbumUpdateInput({ albumData: { images: [{ id: 'a' }, { id: 'b' }], imageOrder: ['b', 'a'] }, existingImages: [{ id: 'a' }, { id: 'b' }], existingImageOrder: ['a', 'b'] })).toEqual({ imageIds: ['b', 'a'] });
  });
});

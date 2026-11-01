import { readFileSync } from 'node:fs';
import { buildSchema, coerceInputValue, isInputType, parse, validate } from 'graphql';
import { describe, it, expect } from 'vitest';
import { buildAlbumUpdateInput } from '@/utils/albumUpdateInput';
const schema = buildSchema(readFileSync('graphql-schema/schema.graphql', 'utf8'));
function coerceAlbum(value: unknown) {
  const type = schema.getType('DiscussionAlbumInput');
  if (!type || !isInputType(type)) throw new Error('Album contract missing from pin');
  return coerceInputValue(value, type);
}
describe('album wire contract against pinned schema', () => {
  it('accepts the actual builder payload with explicit null metadata', () => {
    const value = buildAlbumUpdateInput({ albumData: { images: [{ id: 'a', caption: null }] }, existingImages: [{ id: 'a', caption: 'old' }] });
    expect(coerceAlbum(value)).toEqual({ imageIds: ['a'], imageUpdates: [{ id: 'a', caption: null }] });
  });
  it('accepts explicit empty membership', () => {
    expect(coerceAlbum({ imageIds: [] })).toEqual({ imageIds: [] });
  });
  it('rejects an attempted uploader relationship', () => {
    expect(() => coerceAlbum({ imageIds: ['a'], imageUpdates: [{ id: 'a', Uploader: { username: 'other' } }] })).toThrow();
  });
  it('rejects URL edits', () => {
    expect(() => coerceAlbum({ imageIds: ['a'], imageUpdates: [{ id: 'a', url: 'other' }] })).toThrow();
  });
  it('validates the album argument on the served update operation', () => {
    expect(validate(schema, parse('mutation AlbumWrite($where: DiscussionWhere!, $album: DiscussionAlbumInput!) { updateDiscussionWithChannelConnections(where: $where, discussionUpdateInput: {}, album: $album) { id } }'))).toEqual([]);
  });
});

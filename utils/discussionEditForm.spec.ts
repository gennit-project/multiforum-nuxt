import { describe, it, expect } from 'vitest';
import { buildDiscussionEditFormValues } from './discussionEditForm';

describe('buildDiscussionEditFormValues', () => {
  it('maps the basic fields', () => {
    const values = buildDiscussionEditFormValues({
      title: 'Hello',
      body: 'World',
      Author: { username: 'alice' },
    });
    expect(values).toMatchObject({
      title: 'Hello',
      body: 'World',
      author: 'alice',
    });
  });

  it('maps tags to their text', () => {
    const values = buildDiscussionEditFormValues({
      Tags: [{ text: 'cats' }, { text: 'dogs' }],
    });
    expect(values.selectedTags).toEqual(['cats', 'dogs']);
  });

  it('maps discussion channels to their unique names', () => {
    const values = buildDiscussionEditFormValues({
      DiscussionChannels: [{ Channel: { uniqueName: 'cats' } }],
    });
    expect(values.selectedChannels).toEqual(['cats']);
  });

  it('keeps only images with both an id and a url', () => {
    const values = buildDiscussionEditFormValues({
      Album: {
        Images: [
          { id: 'a', url: 'a.png' },
          { id: 'b', url: '' },
          { id: '', url: 'c.png' },
        ],
      },
    });
    expect(values.album.images.map((i) => i.id)).toEqual(['a']);
  });

  it('drops order ids that do not reference a kept image', () => {
    const values = buildDiscussionEditFormValues({
      Album: {
        Images: [{ id: 'a', url: 'a.png' }],
        imageOrder: ['a', 'missing', null, ''],
      },
    });
    expect(values.album.imageOrder).toEqual(['a']);
  });

  it('defaults missing fields to empty values', () => {
    const values = buildDiscussionEditFormValues({});
    expect(values).toMatchObject({
      title: '',
      body: '',
      author: '',
      selectedTags: [],
      selectedChannels: [],
      crosspostId: null,
    });
  });

  it('reads the crosspost id when present', () => {
    const values = buildDiscussionEditFormValues({
      CrosspostedDiscussion: { id: 'x1' },
    });
    expect(values.crosspostId).toBe('x1');
  });
});

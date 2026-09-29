import { describe, expect, it } from 'vitest';
import { isTrustedUploadedImageUrl } from './image-text-suggestion';

describe('isTrustedUploadedImageUrl', () => {
  it.each([
    [
      'instance upload',
      'https://storage.googleapis.com/forum-images/users/alice/cat.jpg',
      'forum-images',
      true,
    ],
    [
      'encoded upload',
      'https://storage.googleapis.com/forum-images/cat%20photo.jpg',
      'forum-images',
      true,
    ],
    [
      'lookalike bucket',
      'https://storage.googleapis.com/forum-images-evil/cat.jpg',
      'forum-images',
      false,
    ],
    [
      'external host',
      'https://example.com/forum-images/cat.jpg',
      'forum-images',
      false,
    ],
    [
      'insecure upload',
      'http://storage.googleapis.com/forum-images/cat.jpg',
      'forum-images',
      false,
    ],
    [
      'URL credentials',
      'https://user:password@storage.googleapis.com/forum-images/cat.jpg',
      'forum-images',
      false,
    ],
    ['invalid URL', 'not a url', 'forum-images', false],
    [
      'missing bucket configuration',
      'https://storage.googleapis.com/forum-images/cat.jpg',
      '',
      false,
    ],
  ])('%s is trusted: %s', (_label, imageUrl, bucket, expected) => {
    expect(isTrustedUploadedImageUrl({ imageUrl, bucket })).toBe(expected);
  });
});

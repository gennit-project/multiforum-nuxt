import { describe, it, expect } from 'vitest';
import {
  truncateDescription,
  buildDiscussionHead,
  buildDiscussionStructuredData,
  DESCRIPTION_MAX_LENGTH,
} from './discussionSeo';

const BASE = {
  channelId: 'cats',
  discussionId: 'd1',
  serverDisplayName: 'Topical',
  baseUrl: 'https://example.test',
};

describe('truncateDescription', () => {
  it('leaves short text untouched', () => {
    expect(truncateDescription('hello')).toBe('hello');
  });

  it('truncates and appends an ellipsis past the max length', () => {
    const long = 'a'.repeat(DESCRIPTION_MAX_LENGTH + 10);
    expect(truncateDescription(long)).toBe(`${'a'.repeat(160)}...`);
  });
});

describe('buildDiscussionHead - loading state', () => {
  it('uses a channel-scoped fallback title when data has not loaded', () => {
    const head = buildDiscussionHead({ ...BASE, discussions: null });
    expect(head.title).toBe('Discussion | cats');
  });

  it('uses the server fallback description when data has not loaded', () => {
    const head = buildDiscussionHead({ ...BASE, discussions: undefined });
    expect(head.description).toBe('View this discussion on Topical');
  });
});

describe('buildDiscussionHead - not found', () => {
  it('reports a not-found title for an empty result', () => {
    const head = buildDiscussionHead({ ...BASE, discussions: [] });
    expect(head.title).toBe('Discussion Not Found | cats');
  });

  it('omits the channel suffix when there is no channel id', () => {
    const head = buildDiscussionHead({
      ...BASE,
      channelId: '',
      discussions: [],
    });
    expect(head.title).toBe('Discussion Not Found');
  });
});

describe('buildDiscussionHead - loaded', () => {
  const discussion = {
    title: 'My post',
    body: 'Hello world',
    coverImageURL: 'https://img.test/x.png',
    createdAt: '2024-01-01T00:00:00Z',
    Author: { username: 'alice', displayName: 'Alice' },
  };

  it('formats the title with channel and server name', () => {
    const head = buildDiscussionHead({ ...BASE, discussions: [discussion] });
    expect(head.title).toBe('My post | cats | Topical');
  });

  it('uses a summary_large_image twitter card when a cover image exists', () => {
    const head = buildDiscussionHead({ ...BASE, discussions: [discussion] });
    const card = head.meta?.find((m) => m.name === 'twitter:card');
    expect(card?.content).toBe('summary_large_image');
  });

  it('falls back to a summary twitter card without a cover image', () => {
    const head = buildDiscussionHead({
      ...BASE,
      discussions: [{ ...discussion, coverImageURL: '' }],
    });
    const card = head.meta?.find((m) => m.name === 'twitter:card');
    expect(card?.content).toBe('summary');
  });

  it('omits og:image when there is no cover image', () => {
    const head = buildDiscussionHead({
      ...BASE,
      discussions: [{ ...discussion, coverImageURL: null }],
    });
    expect(head.meta?.some((m) => m.property === 'og:image')).toBe(false);
  });

  it('truncates a long body for the description meta', () => {
    const head = buildDiscussionHead({
      ...BASE,
      discussions: [{ ...discussion, body: 'x'.repeat(200) }],
    });
    const desc = head.meta?.find((m) => m.name === 'description');
    expect(desc?.content).toBe(`${'x'.repeat(160)}...`);
  });

  it('emits a JSON-LD structured-data script', () => {
    const head = buildDiscussionHead({ ...BASE, discussions: [discussion] });
    expect(head.script?.[0].type).toBe('application/ld+json');
  });
});

describe('buildDiscussionStructuredData', () => {
  it('falls back to Anonymous when the author has no name', () => {
    const data = buildDiscussionStructuredData({
      discussion: { Author: null },
      title: 'T',
      description: 'D',
      ...BASE,
    });
    expect((data.author as { name: string }).name).toBe('Anonymous');
  });

  it('uses createdAt as dateModified when updatedAt is absent', () => {
    const data = buildDiscussionStructuredData({
      discussion: { createdAt: '2024-01-01T00:00:00Z' },
      title: 'T',
      description: 'D',
      ...BASE,
    });
    expect(data.dateModified).toBe('2024-01-01T00:00:00Z');
  });
});

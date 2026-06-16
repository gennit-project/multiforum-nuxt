import { describe, it, expect } from 'vitest';
import {
  truncateDescription,
  buildEventSeoMeta,
  buildEventStructuredData,
  type EventSeoData,
} from '@/utils/eventSeo';

const baseEvent: EventSeoData = {
  id: 'e1',
  title: 'Trivia Night',
  description: 'Come play trivia',
  startTime: '2024-06-01T18:00:00Z',
  endTime: '2024-06-01T20:00:00Z',
  coverImageURL: 'https://img/x.png',
  Poster: { username: 'alice', displayName: 'Alice' },
};

describe('truncateDescription', () => {
  it('leaves short text unchanged', () => {
    expect(truncateDescription('short', 160)).toBe('short');
  });

  it('truncates long text and appends an ellipsis', () => {
    expect(truncateDescription('a'.repeat(200), 160)).toBe(
      `${'a'.repeat(160)}...`
    );
  });
});

describe('buildEventSeoMeta', () => {
  it('returns not-found meta when there is no event', () => {
    expect(
      buildEventSeoMeta({
        event: null,
        channelId: 'cats',
        forumName: '',
        serverDisplayName: 'Server',
      }).title
    ).toBe('Event Not Found | cats');
  });

  it('includes the forum and server in the title', () => {
    expect(
      buildEventSeoMeta({
        event: baseEvent,
        channelId: 'cats',
        forumName: 'Cats',
        serverDisplayName: 'Server',
      }).title
    ).toBe('Trivia Night | Cats | Server');
  });

  it('omits the forum from the title when none is given', () => {
    expect(
      buildEventSeoMeta({
        event: baseEvent,
        channelId: '',
        forumName: '',
        serverDisplayName: 'Server',
      }).title
    ).toBe('Trivia Night | Server');
  });

  it('falls back to a generated description when the event has none', () => {
    const meta = buildEventSeoMeta({
      event: { ...baseEvent, description: '' },
      channelId: 'cats',
      forumName: 'Cats',
      serverDisplayName: 'Server',
    });
    expect(meta.description).toContain('Trivia Night - Event on');
  });
});

describe('buildEventStructuredData', () => {
  it('uses a Place location when an address is present', () => {
    const data = buildEventStructuredData({
      event: { ...baseEvent, address: '123 Main St' },
      baseUrl: 'https://x',
    });
    expect((data.location as { '@type': string })['@type']).toBe('Place');
  });

  it('uses a VirtualLocation with a fallback url when there is no address', () => {
    const data = buildEventStructuredData({
      event: { ...baseEvent, address: '', virtualEventUrl: null },
      baseUrl: 'https://x',
    });
    expect((data.location as { url: string }).url).toBe(
      'https://x/events/list/search/e1'
    );
  });

  it('marks a canceled event with EventCancelled status', () => {
    const data = buildEventStructuredData({
      event: { ...baseEvent, canceled: true },
      baseUrl: 'https://x',
    });
    expect(data.eventStatus).toBe('https://schema.org/EventCancelled');
  });

  it('falls back to Anonymous when there is no poster', () => {
    const data = buildEventStructuredData({
      event: { ...baseEvent, Poster: null },
      baseUrl: 'https://x',
    });
    expect((data.organizer as { name: string }).name).toBe('Anonymous');
  });
});

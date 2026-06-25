import { describe, it, expect } from 'vitest';
import {
  truncateDescription,
  buildEventSeoMeta,
  buildEventStructuredData,
  type EventSeoData,
} from './eventSeo';

describe('truncateDescription', () => {
  it('leaves a short description unchanged', () => {
    expect(truncateDescription('short', 160)).toBe('short');
  });

  it('truncates and appends an ellipsis past the limit', () => {
    expect(truncateDescription('abcdef', 3)).toBe('abc...');
  });
});

describe('buildEventSeoMeta', () => {
  const params = {
    channelId: 'cats',
    forumName: 'Cats Forum',
    serverDisplayName: 'Multiforum',
  };

  it('returns a not-found title when the event is missing', () => {
    expect(
      buildEventSeoMeta({ ...params, event: null }).title
    ).toBe('Event Not Found | cats');
  });

  it('composes title with forum and server name', () => {
    expect(
      buildEventSeoMeta({
        ...params,
        event: { title: 'Meetup', startTime: '2024-01-01T00:00:00Z' },
      }).title
    ).toBe('Meetup | Cats Forum | Multiforum');
  });

  it('uses the event description when present', () => {
    expect(
      buildEventSeoMeta({
        ...params,
        event: { title: 'Meetup', description: 'Come hang out' },
      }).description
    ).toBe('Come hang out');
  });
});

describe('buildEventStructuredData', () => {
  const event: EventSeoData = {
    id: 'e1',
    title: 'Meetup',
    startTime: '2024-01-01T00:00:00Z',
    endTime: '2024-01-01T02:00:00Z',
  };

  it('produces a schema.org Event', () => {
    expect(
      buildEventStructuredData({ event, baseUrl: 'https://x.test' })['@type']
    ).toBe('Event');
  });

  it('marks a canceled event with the cancelled status', () => {
    expect(
      buildEventStructuredData({
        event: { ...event, canceled: true },
        baseUrl: 'https://x.test',
      }).eventStatus
    ).toBe('https://schema.org/EventCancelled');
  });

  it('uses a Place location when an address is present', () => {
    const data = buildEventStructuredData({
      event: { ...event, address: '1 Main St' },
      baseUrl: 'https://x.test',
    });
    expect((data.location as { '@type': string })['@type']).toBe('Place');
  });

  it('uses an online attendance mode when a virtual URL is present', () => {
    expect(
      buildEventStructuredData({
        event: { ...event, virtualEventUrl: 'https://meet.test' },
        baseUrl: 'https://x.test',
      }).eventAttendanceMode
    ).toBe('https://schema.org/OnlineEventAttendanceMode');
  });
});

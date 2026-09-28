import { describe, it, expect } from 'vitest';
import {
  buildEventHead,
  buildEventSeoMeta,
  buildEventStructuredData,
  type EventSeoData,
} from './eventSeo';

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

  it('strips markdown from the event description', () => {
    expect(
      buildEventSeoMeta({
        ...params,
        event: { title: 'Meetup', description: '**Bring** a [snack](https://x.test)' },
      }).description
    ).toBe('Bring a snack');
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

describe('buildEventHead', () => {
  const params = {
    channelId: 'cats',
    forumName: 'Cats Forum',
    serverDisplayName: 'Multiforum',
    baseUrl: 'https://example.test',
  };
  const event = {
    id: 'e1',
    title: 'Meetup',
    description: 'Come hang out',
    startTime: '2024-01-01T00:00:00Z',
    coverImageURL: 'https://img.test/c.png',
  };
  const metaContent = (head: ReturnType<typeof buildEventHead>, key: string) =>
    head.meta.find((m) => (m.name || m.property) === key)?.content;

  it.each([
    ['description', 'Come hang out'],
    ['og:description', 'Come hang out'],
    ['og:title', 'Meetup | Cats Forum | Multiforum'],
    ['og:type', 'event'],
    ['og:image', 'https://img.test/c.png'],
  ])('emits %s', (key, expected) => {
    expect(metaContent(buildEventHead({ ...params, event }), key)).toBe(expected);
  });

  it('omits image tags when the event has no cover image', () => {
    expect(
      metaContent(buildEventHead({ ...params, event: { ...event, coverImageURL: '' } }), 'og:image')
    ).toBeUndefined();
  });

  it('emits schema.org Event JSON-LD in the script body', () => {
    const [script] = buildEventHead({ ...params, event }).script!;
    expect(JSON.parse(script.innerHTML)['@type']).toBe('Event');
  });

  it('has no JSON-LD while the event is missing', () => {
    expect(buildEventHead({ ...params, event: null }).script).toBeUndefined();
  });
});

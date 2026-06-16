import { DateTime } from 'luxon';

/**
 * Pure builders for EventDetail's SEO metadata and schema.org structured data,
 * extracted from a watchEffect so they can be unit-tested without mounting the
 * component or wiring up useHead.
 */

export type EventSeoData = {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  address?: string | null;
  virtualEventUrl?: string | null;
  coverImageURL?: string | null;
  canceled?: boolean | null;
  Poster?: { username?: string | null; displayName?: string | null } | null;
};

export const DESCRIPTION_MAX_LENGTH = 160;

export function formatEventDate(iso: string): string {
  return DateTime.fromISO(iso).toLocaleString(DateTime.DATE_FULL);
}

export function truncateDescription(
  text: string,
  max: number = DESCRIPTION_MAX_LENGTH
): string {
  return text.length > max ? `${text.substring(0, max)}...` : text;
}

const eventTitle = (event: EventSeoData): string => event.title || 'Event';

const eventDescription = (event: EventSeoData): string => {
  if (event.description) {
    return truncateDescription(event.description);
  }
  return `${eventTitle(event)} - Event on ${formatEventDate(event.startTime || '')}`;
};

export type EventSeoMeta = {
  title: string;
  description: string;
  image?: string;
  type?: string;
};

export type BuildEventSeoMetaParams = {
  event: EventSeoData | null | undefined;
  channelId: string;
  forumName: string;
  serverDisplayName: string;
};

export function buildEventSeoMeta(params: BuildEventSeoMetaParams): EventSeoMeta {
  const { event, channelId, forumName, serverDisplayName } = params;
  if (!event) {
    return {
      title: `Event Not Found${channelId ? ` | ${channelId}` : ''}`,
      description: 'The requested event could not be found.',
    };
  }

  const title = eventTitle(event);
  return {
    title: forumName
      ? `${title} | ${forumName} | ${serverDisplayName}`
      : `${title} | ${serverDisplayName}`,
    description: eventDescription(event),
    image: event.coverImageURL || '',
    type: 'event',
  };
}

export type BuildEventStructuredDataParams = {
  event: EventSeoData;
  baseUrl: string;
};

/** schema.org Event JSON-LD object. */
export function buildEventStructuredData(
  params: BuildEventStructuredDataParams
): Record<string, unknown> {
  const { event, baseUrl } = params;
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: eventTitle(event),
    description: eventDescription(event),
    startDate: event.startTime,
    endDate: event.endTime,
    image: event.coverImageURL || '',
    location: event.address
      ? {
          '@type': 'Place',
          name: event.address,
          address: {
            '@type': 'PostalAddress',
            streetAddress: event.address,
          },
        }
      : {
          '@type': 'VirtualLocation',
          url:
            event.virtualEventUrl ??
            `${baseUrl}/events/list/search/${event.id}`,
        },
    organizer: {
      '@type': 'Person',
      name:
        event.Poster?.displayName || event.Poster?.username || 'Anonymous',
    },
    eventStatus: event.canceled
      ? 'https://schema.org/EventCancelled'
      : 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.virtualEventUrl
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
  };
}

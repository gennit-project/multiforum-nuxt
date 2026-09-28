import { DateTime } from 'luxon';
import { toMetaDescription } from '@/utils/discussionSeo';
import { jsonLdScript, type HeadMeta, type HeadObject } from '@/utils/seoHead';

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

export function formatEventDate(iso: string): string {
  return DateTime.fromISO(iso).toLocaleString(DateTime.DATE_FULL);
}

const eventTitle = (event: EventSeoData): string => event.title || 'Event';

const eventDescription = (event: EventSeoData): string => {
  if (event.description) {
    return toMetaDescription(event.description);
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

export type BuildEventHeadParams = BuildEventSeoMetaParams & {
  baseUrl: string;
};

/**
 * Full `useHead` object for the event detail page: title, description,
 * OpenGraph/Twitter tags and schema.org Event JSON-LD.
 *
 * The page used to pass `buildEventSeoMeta()` straight to `useHead`, which
 * ignores `description` / `image` / `type` keys, so event pages rendered a
 * title and nothing else (#583).
 */
export function buildEventHead(params: BuildEventHeadParams): HeadObject {
  const { event, baseUrl } = params;
  const seo = buildEventSeoMeta(params);
  const meta: HeadMeta[] = [
    { name: 'description', content: seo.description },
    { property: 'og:title', content: seo.title },
    { property: 'og:description', content: seo.description },
    { name: 'twitter:title', content: seo.title },
    { name: 'twitter:description', content: seo.description },
  ];
  if (seo.type) meta.push({ property: 'og:type', content: seo.type });
  if (seo.image) {
    meta.push({ property: 'og:image', content: seo.image });
    meta.push({ name: 'twitter:card', content: 'summary_large_image' });
    meta.push({ name: 'twitter:image', content: seo.image });
  }

  return {
    title: seo.title,
    meta,
    ...(event
      ? { script: [jsonLdScript(buildEventStructuredData({ event, baseUrl }))] }
      : {}),
  };
}

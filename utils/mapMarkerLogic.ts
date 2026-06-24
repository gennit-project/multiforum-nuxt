import type { Event } from '@/__generated__/graphql';

/**
 * Pure helpers extracted from components/event/map/Map.vue so the marker
 * data-shaping and label/content building can be unit-tested without loading
 * the Google Maps SDK.
 */

export type LocationGroup = {
  marker: null;
  events: Record<string, Event>;
  numberOfEvents: number;
};

/** Stable id for a marker location, or null when the event has no location. */
export function buildEventLocationId(event: Pick<Event, 'location'>): string | null {
  if (!event.location) return null;
  return `${event.location.latitude}${event.location.longitude}`;
}

/**
 * Group events that share a location into one entry each, recording every
 * event at the location and the count. Events without a location are skipped.
 */
export function groupEventsByLocation(
  events: Event[]
): Record<string, LocationGroup> {
  const markers: Record<string, LocationGroup> = {};

  events.forEach((event) => {
    const locationId = buildEventLocationId(event);
    if (locationId === null) return;

    const existing = markers[locationId];
    if (existing) {
      existing.events[event.id] = event;
      existing.numberOfEvents += 1;
    } else {
      markers[locationId] = {
        marker: null,
        events: { [event.id]: event },
        numberOfEvents: 1,
      };
    }
  });

  return markers;
}

/** Marker title text, depending on how many events share the location. */
export function buildMarkerTitle(
  numberOfEvents: number,
  firstEventTitle?: string | null
): string {
  return numberOfEvents === 1
    ? `Click to view event: ${firstEventTitle || 'Untitled Event'}`
    : `Click to view ${numberOfEvents} events at this location`;
}

/** Hover-tooltip HTML for a marker (single event title vs an event count). */
export function buildMarkerHoverContent(
  numberOfEvents: number,
  firstEventTitle?: string | null,
  locationName?: string | null
): string {
  const heading =
    numberOfEvents === 1
      ? `<b>${firstEventTitle || 'Untitled Event'}</b>`
      : `<b>${numberOfEvents} events</b>`;
  const locationSuffix = locationName ? `<br>at ${locationName}` : '';
  return `<div style="text-align:center">${heading}${locationSuffix}</div>`;
}

/** Cluster bubble color: red for large clusters, blue otherwise. */
export function buildClusterColor(count: number): string {
  return count > 10 ? '#ef4444' : '#3b82f6';
}

/** Zoom level to apply when a cluster is clicked, capped at maxZoom. */
export function calculateClusterZoom(currentZoom: number, maxZoom = 18): number {
  return Math.min(currentZoom + 1, maxZoom);
}

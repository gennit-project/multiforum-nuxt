/**
 * Adapters from loaded event data to the short-URL link helpers in
 * `utils/contentUrls.ts`. An event's number is scoped to a forum, so the
 * number for a link has to come from the EventChannel of the forum the link
 * points at.
 */
import {
  getEventRoute,
  getEventSegment,
  getEventUrl,
} from '@/utils/contentUrls';
import type { EventLinkTarget } from '@/utils/contentUrls';

type EventChannelNumberSource = {
  channelUniqueName?: string | null;
  eventNumber?: number | null;
};

export type EventLinkSource = {
  id?: string | null;
  title?: string | null;
  EventChannels?: ReadonlyArray<EventChannelNumberSource | null> | null;
};

type GetEventLinkTargetParams = {
  event: EventLinkSource;
  /** Forum the link points at; defaults to the event's first forum. */
  forumId?: string | null;
};

/** The EventChannel number for a forum, or null when it was not selected. */
export const getEventNumberForForum = ({
  event,
  forumId,
}: GetEventLinkTargetParams): number | null =>
  event.EventChannels?.find((channel) => channel?.channelUniqueName === forumId)
    ?.eventNumber ?? null;

export const getEventLinkTarget = ({
  event,
  forumId,
}: GetEventLinkTargetParams): EventLinkTarget => {
  const resolvedForumId =
    forumId || event.EventChannels?.[0]?.channelUniqueName || '';
  return {
    forumId: resolvedForumId,
    eventNumber: getEventNumberForForum({ event, forumId: resolvedForumId }),
    title: event.title,
    eventId: event.id,
  };
};

export const getEventLinkUrl = (params: GetEventLinkTargetParams) =>
  getEventUrl(getEventLinkTarget(params));

export const getEventLinkRoute = (params: GetEventLinkTargetParams) =>
  getEventRoute(getEventLinkTarget(params));

export const getEventEditUrl = (params: GetEventLinkTargetParams) => {
  const target = getEventLinkTarget(params);
  return `/forums/${target.forumId}/events/edit/${getEventSegment(target)}`;
};

export const getEventFeedbackRoute = (params: GetEventLinkTargetParams) => {
  const target = getEventLinkTarget(params);
  return {
    name: 'forums-forumId-events-feedback-eventId' as const,
    params: { forumId: target.forumId, eventId: getEventSegment(target) },
  };
};

/**
 * Query key carrying the forum on the forum-less search routes
 * (`/events/list/search/[eventId]`, `/map/search/[eventId]`), where the event
 * number alone is ambiguous.
 */
export const EVENT_SEARCH_FORUM_QUERY_KEY = 'forum';

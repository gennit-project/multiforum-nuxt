import type {
  EventDetailSelection,
  EventCommentSection,
  EventRootComment,
} from '@/types/EventPresentation';
import { makeReply } from './replyFixtures';

export const makeEventDetail = (
  overrides: Partial<EventDetailSelection> = {}
): EventDetailSelection => ({
  id: 'e1',
  title: 'Test Event',
  description: 'Event body',
  startTime: '2030-01-01T00:00:00Z',
  endTime: '2030-01-01T01:00:00Z',
  locationName: null,
  address: null,
  virtualEventUrl: null,
  startTimeDayOfWeek: null,
  startTimeHourOfDay: null,
  canceled: false,
  isHostedByOP: null,
  isAllDay: null,
  coverImageURL: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
  free: null,
  isInPrivateResidence: null,
  occurrenceIndex: null,
  cost: null,
  authorIsChannelModerator: null,
  FeedbackCommentsConnection: { aggregate: { count: { nodes: 0 } } },
  FeedbackComments: [],
  Poster: null,
  PastTitleVersions: [],
  PastDescriptionVersions: [],
  DescriptionLastEditedBy: null,
  RecurringEvent: null,
  EventSeries: null,
  location: null,
  Tags: [],
  CommentsConnection: { aggregate: { count: { nodes: 0 } } },
  EventChannels: [
    {
      id: 'ec1',
      eventId: 'e1',
      channelUniqueName: 'cats',
      Channel: {
        uniqueName: 'cats',
        displayName: 'Cats',
        channelIconURL: null,
      },
    },
  ],
  SubscribedToNotifications: [],
  SubscribedToEventUpdates: [],
  ...overrides,
});
export const makeEventSection = (
  eventId = 'e1',
  comments: EventRootComment[] = []
): EventCommentSection => ({
  Event: {
    id: eventId,
    title: 'Fallback event',
    description: null,
    startTime: '2030-01-01T00:00:00Z',
    endTime: '2030-01-01T01:00:00Z',
    locationName: null,
    address: null,
    virtualEventUrl: null,
    startTimeDayOfWeek: null,
    startTimeHourOfDay: null,
    canceled: false,
    isHostedByOP: null,
    isAllDay: null,
    coverImageURL: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
    isInPrivateResidence: null,
    cost: null,
    location: null,
    Tags: [],
    EventChannels: [],
    SubscribedToNotifications: [],
    SubscribedToEventUpdates: [],
    Poster: null,
  },
  Comments: comments,
});
export const makeEventRoot = (id = 'c1'): EventRootComment => ({
  ...makeReply({
    id,
    Event: { id: 'e1' },
    DiscussionChannel: null,
    ParentComment: null,
  }),
  ChildComments: [],
});

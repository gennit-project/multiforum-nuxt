import type {
  AuthorFieldsFragment,
  GetEventsSourcef3f666cbeeQuery,
  GetEventQuery,
  GetEventCommentsQuery,
} from '@/__generated__/operations';
import type { NullableSelection } from './Comment';

export type EventDetailSelection = GetEventQuery['events'][number];
export type EventCommentSection = NonNullable<
  GetEventCommentsQuery['getEventComments']
>;
export type EventRootComment = EventCommentSection['Comments'][number];
type CommentEvent = NonNullable<EventCommentSection['Event']>;

// Shared presentation only: a comment-section fallback lacks detail-only fields.
// Legacy list/moderation callers may additionally provide author display fields.
// Apollo results and pagination always retain their exact generated selections.
export type EventPresentation = Omit<
  NullableSelection<CommentEvent>,
  'Poster'
> &
  Partial<NullableSelection<Omit<EventDetailSelection, keyof CommentEvent>>> & {
    Poster?:
      | (NullableSelection<NonNullable<CommentEvent['Poster']>> &
          Partial<
            NullableSelection<
              Pick<AuthorFieldsFragment, 'displayName' | 'profilePicURL'>
            >
          >)
      | null;
  };
export type EventChannelPresentation =
  EventPresentation['EventChannels'][number];
export type EventRevision = NonNullable<
  EventPresentation['PastDescriptionVersions']
>[number];

export type EventListSelection = GetEventsSourcef3f666cbeeQuery['events'][number];
export type EventListPresentation = NullableSelection<EventListSelection>;

import { gql } from "@apollo/client/core";
import { AUTHOR_FIELDS } from "../discussion/queries";

// Fragment for shared event fields
export const EVENT_FIELDS = gql`
  fragment EventFields on Event {
    id
    title
    description
    startTime
    endTime
    locationName
    address
    virtualEventUrl
    startTimeDayOfWeek
    startTimeHourOfDay
    canceled
    isHostedByOP
    isAllDay
    coverImageURL
    createdAt
    updatedAt
    free
    isInPrivateResidence
    RecurringEvent {
      id
      repeatEvery {
        count
        unit
      }
      repeatEnds {
        type
        count
        until
      }
    }
    location {
      latitude
      longitude
    }
    cost
    Tags {
      text
    }
    CommentsAggregate {
      count
    }
    EventChannels {
      id
      eventId
      channelUniqueName
      Channel {
        uniqueName
        displayName
        channelIconURL
      }
    }
  }
`;

// get event by ID
export const GET_EVENT = gql`
  query getEvent($id: ID!, $channelUniqueName: String!, $loggedInModName: String) {
    events(where: { id: $id }) {
      ...EventFields
      FeedbackCommentsAggregate {
        count
      }
      FeedbackComments(
        where: {
          CommentAuthorConnection: {
            ModerationProfile: { node: { displayName: $loggedInModName } }
          }
        }
      ) {
        id
      }
      Poster {
        username
        createdAt
        discussionKarma
        commentKarma
        ServerRoles {
          showAdminTag
        }
        ChannelRoles(where: { channelUniqueName: $channelUniqueName }) {
          showModTag
        }
      }
    }
  }
  ${EVENT_FIELDS}
`;

export const GET_EVENTS = gql`
  query getEvents($where: EventWhere, $options: EventOptions) {
    eventsAggregate(where: $where) {
      count
    }
    events(where: $where, options: $options) {
      ...EventFields
      cost
      Poster {
        ...AuthorFields
      }
      CommentsAggregate {
        count
      }
      EventChannels {
        id
        eventId
        channelUniqueName
        archived
      }
    }
  }
  ${EVENT_FIELDS}
  ${AUTHOR_FIELDS}
`;

export const GET_EVENT_FEEDBACK = gql`
  query getEventFeedback($id: ID!, $limit: Int, $offset: Int) {
    events(where: { id: $id }) {
      id
      title
      startTime
      endTime
      cost
      free
      FeedbackCommentsAggregate {
        count
      }
      FeedbackComments(options: { limit: $limit, offset: $offset }) {
        id
        text
        createdAt
        archived
        Channel {
          uniqueName
        }
        CommentAuthor {
          ... on ModerationProfile {
            displayName
          }
          ... on User {
            username
          }
        }
        GivesFeedbackOnEvent {
          id
        }
      }
    }
  }
`;

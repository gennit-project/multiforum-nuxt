import { gql } from '@apollo/client/core';
import { AUTHOR_FIELDS } from '../fragments';

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
    occurrenceIndex
    EventSeries {
      id
      title
      repeatPattern {
        type
        count
        daysOfWeek
        endType
        endCount
        endDate
      }
      Occurrences(sort: [{ startTime: ASC }], limit: 20) {
        id
        startTime
        endTime
        canceled
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
    CommentsConnection {
      aggregate {
        count {
          nodes
        }
      }
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
    SubscribedToNotifications {
      username
    }
    SubscribedToEventUpdates {
      username
    }
  }
`;

// get event by ID
export const GET_EVENT = gql`
  query getEvent(
    $id: ID!
    $channelUniqueName: String!
    $loggedInModName: String
  ) {
    events(where: { id: { eq: $id } }) {
      ...EventFields
      FeedbackCommentsConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
      FeedbackComments(
        where: {
          CommentAuthorConnection: {
            ModerationProfile: { node: { displayName: { eq: $loggedInModName } } }
          }
        }
      ) {
        id
      }
      authorIsChannelModerator(channelUniqueName: $channelUniqueName)
      Poster {
        username
        createdAt
        discussionKarma
        commentKarma
      }
      PastTitleVersions(sort: [{ createdAt: DESC }]) {
        id
        Author {
          username
        }
        body
        editReason
        createdAt
      }
      PastDescriptionVersions(sort: [{ createdAt: DESC }]) {
        id
        Author {
          username
        }
        body
        editReason
        createdAt
      }
      DescriptionLastEditedBy {
        username
      }
    }
  }
  ${EVENT_FIELDS}
`;

export const GET_EVENTS = gql`
  query getEvents(
    $where: EventWhere
    $sort: [EventSort!]
    $limit: Int
    $offset: Int
  ) {
    eventsConnection(where: $where) {
      aggregate {
        count {
          nodes
        }
      }
    }
    events(where: $where, sort: $sort, limit: $limit, offset: $offset) {
      ...EventFields
      cost
      Poster {
        ...AuthorFields
      }
      CommentsConnection {
        aggregate {
          count {
            nodes
          }
        }
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
    events(where: { id: { eq: $id } }) {
      id
      title
      startTime
      endTime
      cost
      free
      FeedbackCommentsConnection {
        aggregate {
          count {
            nodes
          }
        }
      }
      FeedbackComments(limit: $limit, offset: $offset) {
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

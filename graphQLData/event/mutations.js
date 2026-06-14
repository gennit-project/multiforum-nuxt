import { gql } from '@apollo/client/core';
import { EVENT_FIELDS } from './queries';

export const CREATE_EVENT_WITH_CHANNEL_CONNECTIONS = gql`
  mutation createEvent($input: [EventCreateInputWithChannels!]!) {
    createEventWithChannelConnections(input: $input) {
      ...EventFields
      EventChannels {
        id
        Channel {
          uniqueName
        }
      }
      Poster {
        username
      }
      Tags {
        text
      }
    }
  }
  ${EVENT_FIELDS}
`;

export const CREATE_EVENT_SERIES_WITH_CHANNEL_CONNECTIONS = gql`
  mutation createEventSeries($input: EventSeriesCreateInput!) {
    createEventSeriesWithChannelConnections(input: $input) {
      id
      title
      description
      locationName
      address
      virtualEventUrl
      cost
      free
      isHostedByOP
      coverImageURL
      canceled
      createdAt
      updatedAt
      repeatPattern {
        type
        count
        daysOfWeek
        endType
        endCount
        endDate
      }
      Poster {
        username
      }
      Tags {
        text
      }
      Occurrences {
        id
        title
        startTime
        endTime
        canceled
        occurrenceIndex
        EventChannels {
          id
          channelUniqueName
          Channel {
            uniqueName
          }
        }
      }
      EventChannels {
        id
        channelUniqueName
        Channel {
          uniqueName
        }
      }
    }
  }
`;

export const UPDATE_EVENT_WITH_CHANNEL_CONNECTIONS = gql`
  mutation updateEvents(
    $updateEventInput: EventUpdateInput!
    $where: EventWhere!
    $channelConnections: [String!]!
    $channelDisconnections: [String!]!
  ) {
    updateEventWithChannelConnections(
      eventUpdateInput: $updateEventInput
      where: $where
      channelConnections: $channelConnections
      channelDisconnections: $channelDisconnections
    ) {
      ...EventFields
      EventChannels {
        id
        channelUniqueName
        eventId
        Channel {
          uniqueName
        }
      }
      Poster {
        username
      }
      Tags {
        text
      }
    }
  }
  ${EVENT_FIELDS}
`;

export const UPDATE_EVENT_IN_SERIES = gql`
  mutation updateEventInSeries(
    $eventId: ID!
    $scope: EventEditScope!
    $eventUpdateInput: EventUpdateInput!
    $channelConnections: [String!]!
    $channelDisconnections: [String!]!
  ) {
    updateEventInSeries(
      eventId: $eventId
      scope: $scope
      eventUpdateInput: $eventUpdateInput
      channelConnections: $channelConnections
      channelDisconnections: $channelDisconnections
    ) {
      ...EventFields
      EventChannels {
        id
        channelUniqueName
        eventId
        Channel {
          uniqueName
        }
      }
      Poster {
        username
      }
      Tags {
        text
      }
    }
  }
  ${EVENT_FIELDS}
`;

export const CANCEL_EVENT = gql`
  mutation cancelEvent(
    $updateEventInput: EventUpdateInput!
    $eventWhere: EventWhere!
    $channelConnections: [String!]!
    $channelDisconnections: [String!]!
  ) {
    updateEventWithChannelConnections(
      eventUpdateInput: $updateEventInput
      where: $eventWhere
      channelConnections: $channelConnections
      channelDisconnections: $channelDisconnections
    ) {
      id
      canceled
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation deleteEvent($id: ID!) {
    deleteEvents(where: { id: $id }) {
      nodesDeleted
      relationshipsDeleted
    }
  }
`;

export const ADD_FEEDBACK_COMMENT_TO_EVENT = gql`
  mutation addFeedbackCommentToEvent(
    $modProfileName: String!
    $text: String!
    $eventId: ID!
    $channelId: String!
  ) {
    createComments(
      input: [
        {
          isRootComment: true
          isFeedbackComment: true
          text: $text
          Channel: { connect: { where: { node: { uniqueName: $channelId } } } }
          CommentAuthor: {
            ModerationProfile: {
              connect: { where: { node: { displayName: $modProfileName } } }
            }
          }
          GivesFeedbackOnEvent: {
            connect: { where: { node: { id: $eventId } } }
          }
        }
      ]
    ) {
      comments {
        id
        isRootComment
        isFeedbackComment
        createdAt
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
        createdAt
        text
      }
    }
  }
`;

export const SUBSCRIBE_TO_EVENT = gql`
  mutation subscribeToEvent($eventId: ID!) {
    subscribeToEvent(eventId: $eventId) {
      id
      SubscribedToNotifications {
        username
      }
    }
  }
`;

export const UNSUBSCRIBE_FROM_EVENT = gql`
  mutation unsubscribeFromEvent($eventId: ID!) {
    unsubscribeFromEvent(eventId: $eventId) {
      id
      SubscribedToNotifications {
        username
      }
    }
  }
`;

export const SUBSCRIBE_TO_EVENT_UPDATES = gql`
  mutation subscribeToEventUpdates($eventId: ID!) {
    subscribeToEventUpdates(eventId: $eventId) {
      id
      SubscribedToEventUpdates {
        username
      }
    }
  }
`;

export const UNSUBSCRIBE_FROM_EVENT_UPDATES = gql`
  mutation unsubscribeFromEventUpdates($eventId: ID!) {
    unsubscribeFromEventUpdates(eventId: $eventId) {
      id
      SubscribedToEventUpdates {
        username
      }
    }
  }
`;

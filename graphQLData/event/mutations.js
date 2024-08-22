import { gql } from "@apollo/client/core";
import { EVENT_FIELDS } from "./queries";

export const CREATE_EVENT_WITH_CHANNEL_CONNECTIONS = gql`
  mutation createEvent(
    $eventCreateInput: EventCreateInput
    $channelConnections: [String]
  ) {
    createEventWithChannelConnections(
      eventCreateInput: $eventCreateInput
      channelConnections: $channelConnections
    ) {
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

export const CANCEL_EVENT = gql`
  mutation ($updateEventInput: EventUpdateInput, $eventWhere: EventWhere) {
    updateEvents(update: $updateEventInput, where: $eventWhere) {
      events {
        id
        canceled
      }
    }
  }
`;


export const DELETE_EVENTS = gql`
  mutation deleteEvent($id: [ID!]) {
    deleteEvent(filter: { id: $id }) {
      event {
        id
      }
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation deleteEvent($id: ID!) {
      deleteEvents(
        where: {
          id: $id
        }
    ) {
      nodesDeleted
      relationshipsDeleted    
    }
  }
`;

export const GIVE_FEEDBACK_ON_EVENT = gql`
mutation giveFeedbackOnEvent($eventId: ID!, $modProfileName: String!, $commentText: String!,
$channelUniqueName: String!) {
  giveFeedbackOnEvent(
    eventId: $eventId, 
    modProfileName: $modProfileName, 
    commentText: $commentText,
    channelUniqueName: $channelUniqueName
    ) {
    text
  }
}
`

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
        createdAt
        Channel {
          uniqueName
        }
        CommentAuthor {
          ... on ModerationProfile {
            displayName
          }
        }
        createdAt
        text
      }
    }
  }
`;

import { gql } from '@apollo/client/core';
import { AUTHOR_FIELDS } from '../discussion/queries';

export const COMMENT_VOTE_FIELDS = gql`
  fragment CommentVoteFields on Comment {
    UpvotedByUsers {
      username
    }
    UpvotedByUsersAggregate {
      count
    }
  }
`;

const COMMENT_FIELDS = gql`
  ${COMMENT_VOTE_FIELDS}
  fragment CommentFields on Comment {
    id
    text
    emoji
    weightedVotesCount
    createdAt
    updatedAt
    archived
    isFavoritedByUser
    CommentAuthor {
      ... on ModerationProfile {
        displayName
      }
      ... on User {
        username
        profilePicURL
        createdAt
        discussionKarma
        commentKarma
        ChannelRoles {
          showModTag
        }
      }
    }
    ChildCommentsAggregate {
      count
    }
    ParentComment {
      id
    }
    PastVersions {
      id
      body
      editReason
      createdAt
      Author {
        username
      }
    }
    Event {
      id
    }
    DiscussionChannel {
      id
      channelUniqueName
      discussionId
    }
    ...CommentVoteFields
  }
`;

export const GET_DISCUSSION_COMMENTS = gql`
  query getCommentSection(
    $channelUniqueName: String!
    $discussionId: ID!
    $modName: String
    $offset: Int
    $limit: Int
    $sort: String
  ) {
    getCommentSection(
      channelUniqueName: $channelUniqueName
      discussionId: $discussionId
      modName: $modName
      offset: $offset
      limit: $limit
      sort: $sort
    ) {
      DiscussionChannel {
        id
        weightedVotesCount
        discussionId
        channelUniqueName
        emoji
        archived
        locked
        answered
        Channel {
          uniqueName
          feedbackEnabled
          Bots {
            username
            displayName
            botProfileId
            isDeprecated
          }
        }
        Discussion {
          id
          title
          Author {
            ...AuthorFields
            ... on User {
              ChannelRoles {
                showModTag
              }
            }
          }
        }
        CommentsAggregate {
          count
        }
        UpvotedByUsers {
          username
        }
        UpvotedByUsersAggregate {
          count
        }
        SubscribedToNotifications {
          username
        }
        Answers {
          id
          text
          createdAt
          CommentAuthor {
            ... on User {
              username
              displayName
            }
            ... on ModerationProfile {
              displayName
            }
          }
        }
      }
      Comments {
        id
        text
        emoji
        weightedVotesCount
        createdAt
        updatedAt
        archived
        isFavoritedByUser
        CommentAuthor {
          ...AuthorFields
          ... on User {
            ChannelRoles {
              showModTag
            }
          }
        }
        ChildCommentsAggregate {
          count
        }
        ParentComment {
          id
        }
        ChildComments {
          id
          text
        }
        FeedbackComments {
          id
        }
        PastVersions {
          id
          body
          createdAt
          Author {
            username
          }
        }
        ...CommentVoteFields
      }
    }
  }
  ${AUTHOR_FIELDS}
  ${COMMENT_VOTE_FIELDS}
`;

export const GET_EVENT_COMMENTS = gql`
  query getEventComments(
    $eventId: ID!
    $offset: Int
    $limit: Int
    $sort: SortType
  ) {
    getEventComments(
      eventId: $eventId
      offset: $offset
      limit: $limit
      sort: $sort
    ) {
      Event {
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
        isInPrivateResidence
        location {
          latitude
          longitude
        }
        cost
      }
      Comments {
        ...CommentFields
        ChildComments {
          id
          text
        }
      }
    }
  }
  ${COMMENT_FIELDS}
  ${COMMENT_VOTE_FIELDS}
`;

export const GET_DISCUSSION_CHANNEL_ROOT_COMMENT_AGGREGATE = gql`
  query getDiscussionChannelRootCommentAggregate(
    $channelUniqueName: String!
    $discussionId: ID!
  ) {
    discussionChannels(
      where: {
        channelUniqueName: $channelUniqueName
        discussionId: $discussionId
      }
    ) {
      id
      discussionId
      channelUniqueName
      archived
      answered
      locked
      CommentsAggregate(
        where: {
          isRootComment: true
          OR: [{ isFeedbackComment: null }, { isFeedbackComment: false }]
        }
      ) {
        count
      }
    }
  }
`;
export const GET_DISCUSSION_CHANNEL_COMMENT_AGGREGATE = gql`
  query getDiscussionChannelRootCommentAggregate(
    $channelUniqueName: String!
    $discussionId: ID!
  ) {
    discussionChannels(
      where: {
        channelUniqueName: $channelUniqueName
        discussionId: $discussionId
      }
    ) {
      id
      discussionId
      channelUniqueName
      archived
      answered
      locked
      CommentsAggregate(
        where: {
          OR: [{ isFeedbackComment: null }, { isFeedbackComment: false }]
        }
      ) {
        count
      }
    }
  }
`;

export const GET_EVENT_ROOT_COMMENT_AGGREGATE = gql`
  query getEventRootCommentAggregate($eventId: ID!) {
    events(where: { id: $eventId }) {
      id
      CommentsAggregate(where: { isRootComment: true }) {
        count
      }
    }
  }
`;

export const GET_COMMENT_AND_REPLIES = gql`
  query getCommentWithReplies($id: ID!) {
    comments(where: { id: $id }) {
      ...CommentFields
      ChildComments {
        ...CommentFields
      }
      FeedbackComments {
        id
      }
    }
  }
  ${COMMENT_FIELDS}
  ${COMMENT_VOTE_FIELDS}
`;

export const GET_FEEDBACK_COMMENT = gql`
  query getFeedbackComment($id: ID!) {
    comments(where: { id: $id }) {
      id
      text
      createdAt
      archived
      CommentAuthor {
        ... on ModerationProfile {
          displayName
        }
        ... on User {
          username
          profilePicURL
          displayName
          commentKarma
          discussionKarma
          createdAt
        }
      }
      GivesFeedbackOnComment {
        id
      }
      GivesFeedbackOnDiscussion {
        id
      }
      GivesFeedbackOnEvent {
        id
      }
    }
  }
`;

export const GET_ACTIVITY_FEED_COMMENT = gql`
  query getActivityFeedComment($id: ID!) {
    comments(where: { id: $id }) {
      id
      ModerationAction {
        id
        actionType
        actionDescription
        createdAt
        ModerationProfile {
          displayName
          createdAt
          __typename
        }
        Comment {
          id
          text
          createdAt
          CommentAuthor {
            ... on ModerationProfile {
              displayName
              __typename
            }
            ... on User {
              username
              __typename
            }
            __typename
          }
          Issue {
            id
            issueNumber
            __typename
          }
          Channel {
            uniqueName
            __typename
          }
          __typename
        }
      }
      __typename
    }
    __typename
  }
`;

export const GET_COMMENT = gql`
  query getComment($id: ID!) {
    comments(where: { id: $id }) {
      ...CommentFields
      GivesFeedbackOnComment {
        id
        DiscussionChannel {
          channelUniqueName
          discussionId
        }
        Event {
          id
        }
      }
      GivesFeedbackOnDiscussion {
        id
      }
      GivesFeedbackOnEvent {
        id
      }
      DiscussionChannel {
        channelUniqueName
        discussionId
      }
      Event {
        id
      }
      Channel {
        uniqueName
      }
    }
  }
  ${COMMENT_FIELDS}
`;

export const GET_COMMENT_ARCHIVED = gql`
  query getComment($commentId: ID!) {
    comments(where: { id: $commentId }) {
      id
      archived
    }
  }
`;

export const GET_COMMENT_REPLIES = gql`
  query getCommentWithReplies(
    $commentId: ID!
    $modName: String
    $limit: Int
    $offset: Int
    $sort: SortType
  ) {
    getCommentReplies(
      commentId: $commentId
      modName: $modName
      limit: $limit
      offset: $offset
      sort: $sort
    ) {
      aggregateChildCommentCount
      ChildComments {
        ...CommentFields
        FeedbackComments {
          id
        }
      }
    }
  }
  ${COMMENT_FIELDS}
  ${COMMENT_VOTE_FIELDS}
`;

export const GET_FEEDBACK_ON_COMMENT = gql`
  query getFeedbackOnComment(
    $commentId: ID!
    $limit: Int
    $offset: Int
    $loggedInModName: String
  ) {
    comments(where: { id: $commentId }) {
      id
      CommentAuthor {
        ... on User {
          username
          profilePicURL
          displayName
          commentKarma
          discussionKarma
          createdAt
        }
        ... on ModerationProfile {
          displayName
          createdAt
        }
      }
      createdAt
      text
      archived
      FeedbackCommentsAggregate {
        count
      }
      GivesFeedbackOnComment {
        id
      }
      GivesFeedbackOnDiscussion {
        id
      }
      GivesFeedbackOnEvent {
        id
      }
      FeedbackComments(options: { limit: $limit, offset: $offset }) {
        id
        text
        archived
        Channel {
          uniqueName
        }
        CommentAuthor {
          ... on ModerationProfile {
            createdAt
            displayName
          }
          ... on User {
            username
            profilePicURL
            displayName
            commentKarma
            discussionKarma
            createdAt
          }
        }
        createdAt
        FeedbackCommentsAggregate(
          where: {
            CommentAuthorConnection: {
              ModerationProfile: { node: { displayName: $loggedInModName } }
            }
          }
        ) {
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
        GivesFeedbackOnComment {
          id
        }
      }
    }
  }
`;

export const GET_SPECIFIC_COMMENT_FEEDBACK = gql`
  query getSpecificCommentFeedback($commentId: ID, $modName: String) {
    comments(
      where: {
        GivesFeedbackOnComment: { id: $commentId }
        CommentAuthorConnection: {
          ModerationProfile: { node: { displayName: $modName } }
        }
      }
    ) {
      id
      text
      createdAt
      archived
      Channel {
        uniqueName
      }
      CommentAuthor(where: { ModerationProfile: { displayName: $modName } }) {
        ... on ModerationProfile {
          displayName
        }
        ... on User {
          username
          profilePicURL
          displayName
          commentKarma
          discussionKarma
          createdAt
        }
      }
    }
  }
`;

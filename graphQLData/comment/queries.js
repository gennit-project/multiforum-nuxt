import { gql } from "@apollo/client/core";
import { AUTHOR_FIELDS } from "../discussion/queries";

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

export const COMMENT_FIELDS = gql`
  ${COMMENT_VOTE_FIELDS}
  ${AUTHOR_FIELDS}
  fragment CommentFields on Comment {
    id
    text
    emoji
    weightedVotesCount
    createdAt
    updatedAt
    CommentAuthor {
      ...AuthorFields,
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
        Channel {
          uniqueName
        }
        Discussion {
          id
          title
          Author {
            ...AuthorFields,
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
      }
      Comments {
        id
        text
        emoji
        weightedVotesCount
        createdAt
        updatedAt
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
  ${AUTHOR_FIELDS}
  ${COMMENT_FIELDS}
  ${COMMENT_VOTE_FIELDS}
`;

export const GET_DISCUSSION_CHANNEL_BY_ID = gql`
  query getDiscussionChannel($id: ID!) {
    discussionChannels(where: { id: $id }) {
      id
      weightedVotesCount
      discussionId
      channelUniqueName
      Channel {
        uniqueName
      }
      Discussion {
        id
        title
        Author {
          ...AuthorFields
        }
      }
      CommentsAggregate {
        count
      }
      UpvotedByUsersAggregate {
        count
      }
      Comments(where: { isRootComment: true }) {
        ...CommentFields
        ChildComments {
          ...CommentFields
        }
      }
    }
  }
  ${AUTHOR_FIELDS}
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
      CommentsAggregate(where: { isRootComment: true }) {
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
  ${AUTHOR_FIELDS}
  ${COMMENT_FIELDS}
  ${COMMENT_VOTE_FIELDS}
`;

export const GET_FEEDBACK_COMMENT = gql`
  query getFeedbackComment($id: ID!) {
    comments(where: { id: $id }) {
      id
      text
      createdAt
      CommentAuthor {
        ... on ModerationProfile {
          displayName
        }
      }
    }
  }
`;

export const GET_COMMENT = gql`
  query getComment($id: ID!) {
    comments(where: { id: $id }) {
      ...CommentFields
      DiscussionChannel {
        channelUniqueName
        discussionId
      }
      Event {
        id
      }
    }
  }
  ${COMMENT_FIELDS}
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
  ${AUTHOR_FIELDS}
  ${COMMENT_FIELDS}
  ${COMMENT_VOTE_FIELDS}
`;

export const GET_FEEDBACK_ON_COMMENT = gql`
  query getFeedbackOnComment(
    $commentId: ID!,
    $limit: Int, 
    $offset: Int,
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
      FeedbackCommentsAggregate {
        count
      }
      GivesFeedbackOnComment {
        id
      }
      GivesFeedbackOnDiscussion {
        id
      }
      FeedbackComments(options: { limit: $limit, offset: $offset }) {
        id
        text
        Channel {
          uniqueName
        }
        CommentAuthor {
          ... on ModerationProfile {
            createdAt
            displayName
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
      Channel {
        uniqueName
      }
      CommentAuthor(where: { ModerationProfile: { displayName: $modName } }) {
        ... on ModerationProfile {
          displayName
        }
      }
    }
  }
`;

import { gql } from '@apollo/client/core';
import { AUTHOR_FIELDS } from '../fragments';

// Fragment for comment search results with context links
export const SEARCH_COMMENT_FIELDS = gql`
  fragment SearchCommentFields on Comment {
    id
    text
    createdAt
    updatedAt
    textLastEdited
    archived
    CommentAuthor {
      ... on ModerationProfile {
        displayName
      }
      ... on User {
        username
        profilePicURL
        displayName
      }
    }
    Channel {
      uniqueName
      displayName
    }
    DiscussionChannel {
      id
      channelUniqueName
      discussionId
      Discussion {
        id
        title
      }
    }
    Event {
      id
      title
      EventChannels {
        channelUniqueName
      }
    }
  }
`;

// Query for searching comments site-wide
export const SEARCH_COMMENTS = gql`
  query searchComments(
    $where: CommentWhere
    $sort: [CommentSort!]
    $limit: Int
    $offset: Int
  ) {
    comments(where: $where, sort: $sort, limit: $limit, offset: $offset) {
      ...SearchCommentFields
    }
    commentsConnection(where: $where) {
      aggregate {
        count {
          nodes
        }
      }
    }
  }
  ${SEARCH_COMMENT_FIELDS}
`;

export const COMMENT_VOTE_FIELDS = gql`
  fragment CommentVoteFields on Comment {
    UpvotedByUsers {
      username
    }
    UpvotedByUsersConnection {
      aggregate {
        count {
          nodes
        }
      }
    }
    SuperUpvotedByUsers {
      username
    }
  }
`;

export const COMMENT_FIELDS = gql`
  ${COMMENT_VOTE_FIELDS}
  fragment CommentFields on Comment {
    id
    text
    emoji
    weightedVotesCount
    createdAt
    updatedAt
    textLastEdited
    archived
    isSticky
    stickyAt
    stickyByUsername
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
        isBot
      }
    }
    ChildCommentsConnection {
      aggregate {
        count {
          nodes
        }
      }
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
    SubscribedToNotifications {
      username
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
        UpvotedByUsers {
          username
        }
        UpvotedByUsersConnection {
          aggregate {
            count {
              nodes
            }
          }
        }
        SuperUpvotedByUsers {
          username
        }
        Channel {
          uniqueName
          feedbackEnabled
          imageUploadsEnabled
          markdownImagesEnabled
          emojiEnabled
          Bots {
            username
            displayName
            botProfileId
            isDeprecated
          }
          Moderators {
            displayName
          }
        }
        Discussion {
          id
          title
          Author {
            ...AuthorFields
          }
        }
        CommentsConnection(
          where: {
            node: {
              OR: [
                { isFeedbackComment: { eq: null } }
                { isFeedbackComment: { eq: false } }
              ]
            }
          }
        ) {
          aggregate {
            count {
              nodes
            }
          }
        }
        RootCommentsConnection: CommentsConnection(
          where: {
            node: {
              isRootComment: { eq: true }
              OR: [
                { isFeedbackComment: { eq: null } }
                { isFeedbackComment: { eq: false } }
              ]
            }
          }
        ) {
          aggregate {
            count {
              nodes
            }
          }
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
        detailAnswersPageInfo {
          endCursor
          hasNextPage
        }
      }
      Comments {
        id
        text
        emoji
        weightedVotesCount
        createdAt
        updatedAt
        textLastEdited
        archived
        isSticky
        stickyAt
        stickyByUsername
        isFavoritedByUser
        CommentAuthor {
          ...AuthorFields
        }
        ChildCommentsConnection {
          aggregate {
            count {
              nodes
            }
          }
        }
        ParentComment {
          id
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
        SubscribedToNotifications {
          username
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
        Tags {
          text
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
        Poster {
          username
          createdAt
          discussionKarma
          commentKarma
        }
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
        channelUniqueName: { eq: $channelUniqueName }
        discussionId: { eq: $discussionId }
      }
    ) {
      id
      discussionId
      channelUniqueName
      archived
      answered
      locked
      CommentsConnection(
        where: {
          node: {
            isRootComment: { eq: true }
            OR: [
              { isFeedbackComment: { eq: null } }
              { isFeedbackComment: { eq: false } }
            ]
          }
        }
      ) {
        aggregate {
          count {
            nodes
          }
        }
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
        channelUniqueName: { eq: $channelUniqueName }
        discussionId: { eq: $discussionId }
      }
    ) {
      id
      discussionId
      channelUniqueName
      archived
      answered
      locked
      CommentsConnection(
        where: {
          node: {
            OR: [
              { isFeedbackComment: { eq: null } }
              { isFeedbackComment: { eq: false } }
            ]
          }
        }
      ) {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
`;

export const GET_EVENT_ROOT_COMMENT_AGGREGATE = gql`
  query getEventRootCommentAggregate($eventId: ID!) {
    events(where: { id: { eq: $eventId } }) {
      id
      CommentsConnection(where: { node: { isRootComment: { eq: true } } }) {
        aggregate {
          count {
            nodes
          }
        }
      }
    }
  }
`;

export const GET_COMMENT_AND_REPLIES = gql`
  query getPermalinkedComment($id: ID!) {
    comments(where: { id: { eq: $id } }) {
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
    comments(where: { id: { eq: $id } }) {
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
    comments(where: { id: { eq: $id } }) {
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
    comments(where: { id: { eq: $id } }) {
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
    comments(where: { id: { eq: $commentId } }) {
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
    comments(where: { id: { eq: $commentId } }) {
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
      FeedbackCommentsConnection {
        aggregate {
          count {
            nodes
          }
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
      FeedbackComments(limit: $limit, offset: $offset) {
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
        FeedbackCommentsConnection(
          where: {
            node: {
              CommentAuthorConnection: {
                ModerationProfile: {
                  node: { displayName: { eq: $loggedInModName } }
                }
              }
            }
          }
        ) {
          aggregate {
            count {
              nodes
            }
          }
        }
        FeedbackComments(
          where: {
            CommentAuthorConnection: {
              ModerationProfile: {
                node: { displayName: { eq: $loggedInModName } }
              }
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
        GivesFeedbackOnComment: { id: { eq: $commentId } }
        CommentAuthorConnection: {
          ModerationProfile: { node: { displayName: { eq: $modName } } }
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
      # v7 removed the where argument on the Comment.CommentAuthor union field; the
      # mod filter already lives in the top-level comments where (CommentAuthorConnection).
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
    }
  }
`;

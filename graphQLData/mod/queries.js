import { gql } from '@apollo/client/core';

export const COUNT_OPEN_ISSUES = gql`
query countOpenIssues(
  $channelUniqueName: String!
) {
  issuesAggregate (
    where: {
      channelUniqueName: $channelUniqueName,
      isOpen: true
    }
  ) {
    count
  }
}
`;

export const COUNT_CLOSED_ISSUES = gql`
query countClosedIssues(
  $channelUniqueName: String!
) {
  issuesAggregate (
    where: {
      channelUniqueName: $channelUniqueName,
      isOpen: false
    }
  ) {
    count
  }
}
`;

export const GET_MOD = gql`
  query getMod($displayName: String!) {
    moderationProfiles(where: {
      displayName: $displayName
    }) {
      displayName
      createdAt
      AuthoredCommentsAggregate {
        count
        __typename
      }
      AuthoredIssuesAggregate {
        count
        __typename
      }
    }
  }`

export const GET_FEEDBACK_BY_MOD_PROFILE = gql`
query getFeedbackByModProfile {
  moderationProfiles(
    where: {
      displayName: "miniatureDeafeningMysteriousTeacher"
    }
  ) {
    displayName
    
    AuthoredComments {
      Channel {
        uniqueName
      }
      text
      GivesFeedbackOnDiscussion {
        title
      }
      GivesFeedbackOnComment {
        text
      }
      GivesFeedbackOnEvent {
        title
      }
    }
  }
}
`
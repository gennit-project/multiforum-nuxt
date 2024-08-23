import { DiscussionCreateInputWithChannels } from "../seedData/discussions";

const createDiscussions = (discussions: DiscussionCreateInputWithChannels[]) => {
  const getOperation = (discussion: DiscussionCreateInputWithChannels) => {
    return {
      query: `
          mutation createDiscussion(
            $discussionCreateInput: DiscussionCreateInput
            $channelConnections: [String]
          ) {
            createDiscussionWithChannelConnections(
              discussionCreateInput: $discussionCreateInput
              channelConnections: $channelConnections
            ) {
              id
              title
              body
              Author {
                username
              }
              DiscussionChannels {
                id
                createdAt
                channelUniqueName
                discussionId
                UpvotedByUsers {
                  username
                }
                Channel {
                  uniqueName
                }
                Discussion {
                  id
                }
              }
              createdAt
              updatedAt
              Tags {
                text
              }
            }
          }
        `,
      variables: {
        discussionCreateInput: discussion.discussionCreateInput,
        channelConnections: discussion.channelConnections,
      },
    };
  };

  for (let i = 0; i < discussions.length; i++) {
    const discussion = discussions[i];
    cy.request({
      url: "http://localhost:4000/graphql",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: getOperation(discussion),
    });

    const channelConnections = discussion.channelConnections;
  }
};

export default createDiscussions;

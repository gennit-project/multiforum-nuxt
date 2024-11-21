import type { DiscussionCreateInputWithChannels } from "../seedData/discussions";

const createDiscussions = (
  discussions: DiscussionCreateInputWithChannels[]
) => {
  for (let i = 0; i < discussions.length; i++) {
    const discussion = discussions[i];
    cy.authenticatedGraphQL(
      `
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
      {
        discussionCreateInput: discussion.discussionCreateInput,
        channelConnections: discussion.channelConnections,
      }
    );
  }
};

export default createDiscussions;

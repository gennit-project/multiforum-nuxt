import type { DiscussionCreateInput } from "../../../../../__generated__/graphql";

export type DiscussionCreateInputWithChannels = {
  discussionCreateInput: DiscussionCreateInput;
  channelConnections: string[];
};

type BaseDiscussion = {
  title: string;
  body?: string;
  author: string;
  tags: string[];
  channels: string[];
};

const baseDiscussions: BaseDiscussion[] = [
  {
    title: "Example topic 1",
    body: "Test discussion body 1",
    author: "cluse",
    tags: [],
    channels: ["cats"],
  },
  {
    title: "Example topic 2",
    body: undefined,
    author: "cluse",
    tags: ["newYears"],
    channels: ["phx_music"],
  },
  {
    title: "Example topic 3",
    body: undefined,
    author: "cluse",
    tags: ["trivia"],
    channels: ["phx_music"],
  },
];

export const discussions: DiscussionCreateInputWithChannels[] =
  baseDiscussions.map(({ title, body, author, tags, channels }) => ({
    discussionCreateInput: {
      title,
      ...(body && { body }),
      Author: {
        connect: {
          where: {
            node: {
              username: author,
            },
          },
        },
      },
      ...(tags.length > 0 && {
        Tags: {
          connectOrCreate: tags.map((tag) => ({
            onCreate: {
              node: {
                text: tag,
              },
            },
            where: {
              node: {
                text: tag,
              },
            },
          })),
        },
      }),
    },
    channelConnections: channels,
  }));

const createDiscussions = (
  discussions: DiscussionCreateInputWithChannels[]
) => {
  for (let i = 0; i < discussions.length; i++) {
    const discussion = discussions[i];
    try {
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
    } catch (error) {
      console.error(`Failed to create discussion. GraphQL Error: ${error}`);
    }
  }
};

const seedDiscussions = () => {
  createDiscussions(discussions);
};

export default seedDiscussions;

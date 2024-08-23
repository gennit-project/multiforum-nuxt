import { DiscussionCreateInput } from "../../../src/__generated__/graphql";

export type DiscussionCreateInputWithChannels = {
  discussionCreateInput: DiscussionCreateInput;
  channelConnections: string[];
};

export const discussionsForFilteringTests: DiscussionCreateInputWithChannels[] =
  [
    {
      discussionCreateInput: {
        title: "Example topic 1",
        body: "Test discussion body 1",
        Author: {
          connect: {
            where: {
              node: {
                username: "cluse",
              },
            },
          },
        },
      },
      channelConnections: ["cats"],
    },
    {
      discussionCreateInput: {
        title: "Example topic 2",
        Tags: {
          connectOrCreate: [
            {
              onCreate: {
                node: {
                  text: "newYears",
                },
              },
              where: {
                node: {
                  text: "newYears",
                },
              },
            },
          ],
        },
        Author: {
          connect: {
            where: {
              node: {
                username: "cluse",
              },
            },
          },
        },
      },
      channelConnections: ["phx_music"],
    },
    {
      discussionCreateInput: {
        title: "Example topic 3",
        Tags: {
          connectOrCreate: [
            {
              onCreate: {
                node: {
                  text: "trivia",
                },
              },
              where: {
                node: {
                  text: "trivia",
                },
              },
            },
          ],
        },
        Author: {
          connect: {
            where: {
              node: {
                username: "cluse",
              },
            },
          },
        },
      },
      channelConnections: ["phx_music"],
    },
  ];

export default discussionsForFilteringTests;

import { DiscussionCreateInput } from "../../../src/__generated__/graphql";

export type DiscussionCreateInputWithChannels = {
  discussionCreateInput: DiscussionCreateInput;
  channelConnections: string[];
};

export const discussionsForFilteringTests: DiscussionCreateInputWithChannels[] =
  [
    {
      discussionCreateInput: {
        title: "Test discussion 1, about cats",
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
        title: "Test discussion 2",
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
        title: "Test discussion 3",
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

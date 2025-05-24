import type { DiscussionCreateInput } from "../../../../__generated__/graphql";

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

export const discussions: DiscussionCreateInputWithChannels[] = baseDiscussions.map(
  ({ title, body, author, tags, channels }) => ({
    discussionCreateInput: {
      title,
      ...(body && { body }),
      hasDownload: false,
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
  })
);

export default discussions;

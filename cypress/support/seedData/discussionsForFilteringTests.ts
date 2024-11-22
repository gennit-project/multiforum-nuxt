import type { DiscussionCreateInput } from "../../../__generated__/graphql";

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
}

const baseDiscussions: BaseDiscussion[] = [
  {
    title: "Test discussion 1, about cats",
    body: "Test discussion body 1",
    author: "cluse",
    tags: [],
    channels: ["cats"],
  },
  {
    title: "Test discussion 2",
    body: undefined,
    author: "cluse",
    tags: ["newYears"],
    channels: ["phx_music"],
  },
  {
    title: "Test discussion 3",
    body: undefined,
    author: "cluse",
    tags: ["trivia"],
    channels: ["phx_music"],
  },
];

export const discussionsForFilteringTests: DiscussionCreateInputWithChannels[] =
  baseDiscussions.map(({ title, body, author, tags, channels }) => ({
    discussionCreateInput: {
      title,
      ...(body && { body }),
      Author: {
        connect: {
          where: {
            node: {
              username_EQ: author,
            },
          },
        },
      },
      ...(tags.length > 0 && {
        Tags: {
          connect: tags.map((tag: string) => ({
            where: {
              node: {
                text_EQ: tag,
              },
            },
          })),
          create: tags.map((tag) => ({
            node: {
              text: tag,
            },
          })),
        },
      }),
    },
    channelConnections: channels,
  }));

export default discussionsForFilteringTests;

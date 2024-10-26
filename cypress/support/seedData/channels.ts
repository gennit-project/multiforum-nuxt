import type { ChannelCreateInput } from "../../../__generated__/graphql";

const channels: ChannelCreateInput[] = [
  {
    uniqueName: "cats",
    Admins: {
      connect: [
        {
          where: {
            node: {
              username: "cluse",
            },
          },
        },
      ],
    },
  },
  {
    uniqueName: "phx_music",
    Admins: {
      connect: [
        {
          where: {
            node: {
              username: "alice",
            },
          },
        },
      ],
    },
  },
  {
    uniqueName: "phx_concerts",
    Admins: {
      connect: [
        {
          where: {
            node: {
              username: "alice",
            },
          },
        },
      ],
    },
  },
];

export default channels;

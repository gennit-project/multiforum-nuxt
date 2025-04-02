import type { ChannelCreateInput } from "../../../../__generated__/graphql";

type BaseChannel = {
  uniqueName: string;
  admins: string[];
  mods: string[];
};

const baseChannels: BaseChannel[] = [
  {
    uniqueName: "cats",
    admins: ["cluse"],
    mods: ["testModProfile2"]
  },
  {
    uniqueName: "phx_music",
    admins: ["alice"],
    mods: ["testModProfile1"]
  },
  {
    uniqueName: "phx_concerts",
    admins: ["alice"],
    mods: ["testModProfile1"]
  },
];

const channels: ChannelCreateInput[] = baseChannels.map(
  ({ uniqueName, admins, mods }) => ({
    uniqueName,
    Admins: {
      connect: admins.map((admin) => ({
          where: {
            node: {
              username: admin,
          }
        },
      })),
    },
    Moderators: {
      connect: mods.map((mod) => ({
        where: {
          node: {
            ModerationProfile: {
              displayName: mod,
            },
          }
        },
      })),
    },
  })
);

export default channels;
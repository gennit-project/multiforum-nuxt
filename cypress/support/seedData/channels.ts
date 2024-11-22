import type { ChannelCreateInput } from "../../../__generated__/graphql";

type BaseChannel = {
  uniqueName: string;
  admins: string[];
};

const baseChannels: BaseChannel[] = [
  {
    uniqueName: "cats",
    admins: ["cluse"],
  },
  {
    uniqueName: "phx_music",
    admins: ["alice"],
  },
  {
    uniqueName: "phx_concerts",
    admins: ["alice"],
  },
];

const channels: ChannelCreateInput[] = baseChannels.map(({ uniqueName, admins }) => ({
  uniqueName,
  Admins: {
    connect: admins.map((admin) => ({
      where: {
        node: {
          username_EQ: admin,
        },
      },
    })),
  },
}));

export default channels;

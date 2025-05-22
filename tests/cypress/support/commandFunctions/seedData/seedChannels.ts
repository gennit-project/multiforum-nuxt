import type { ChannelCreateInput } from "../../../../__generated__/graphql";

type BaseChannel = {
  uniqueName: string;
  admins: string[];
  mods: string[];
  rules: string;
};

const baseChannels: BaseChannel[] = [
  {
    uniqueName: "cats",
    admins: ["cluse"],
    mods: ["testModProfile2"],
    rules: '[{"summary":"Focus on cats","detail":"Non-cat-related content will be removed."}]',
  },
  {
    uniqueName: "phx_music",
    admins: ["alice"],
    mods: ["testModProfile1"],
    rules: '[{"summary":"Focus on music","detail":"Non-music-related content will be removed."}]',
  },
  {
    uniqueName: "phx_concerts",
    admins: ["alice"],
    mods: ["testModProfile1"],
    rules:
      '[{"summary":"Focus on concerts","detail":"Non-concert-related content will be removed."}]',
  },
];

const channels: ChannelCreateInput[] = baseChannels.map(
  ({ uniqueName, admins, mods, rules }): ChannelCreateInput => ({
    uniqueName,
    rules,
    wikiEnabled: true,
    Admins: {
      connect: admins.map((admin) => ({
        where: {
          node: {
            username: admin,
          },
        },
      })),
    },
    Moderators: {
      connect: mods.map((mod) => ({
        where: {
          node: {
            displayName: mod,
          },
        },
      })),
    },
  })
);

export default channels;

import type { ChannelCreateInput } from "../../../../../__generated__/graphql";
import { FilterMode } from "../../../../../__generated__/graphql";

type BaseChannel = {
  uniqueName: string;
  admins: string[];
  mods: string[];
  rules: string;
  downloadsEnabled?: boolean;
  allowedFileTypes?: string[];
  filterGroups?: Array<{
    key: string;
    displayName: string;
    mode: FilterMode;
    order: number;
    options: Array<{
      value: string;
      displayName: string;
      order: number;
    }>;
  }>;
};

const baseChannels: BaseChannel[] = [
  {
    uniqueName: "cats",
    admins: ["cluse"],
    mods: ["testModProfile2"],
    rules: "[{\"summary\":\"Focus on cats\",\"detail\":\"Non-cat-related content will be removed.\"}]"
  },
  {
    uniqueName: "phx_music",
    admins: ["alice"],
    mods: ["testModProfile1"],
    rules: "[{\"summary\":\"Focus on music\",\"detail\":\"Non-music-related content will be removed.\"}]"
  },
  {
    uniqueName: "phx_concerts",
    admins: ["alice"],
    mods: ["testModProfile1"],
    rules: "[{\"summary\":\"Focus on concerts\",\"detail\":\"Non-concert-related content will be removed.\"}]"
  },
  {
    uniqueName: "sims4_builds",
    admins: ["cluse"],
    mods: ["testModProfile1"],
    rules: "[{\"summary\":\"Share Sims 4 builds\",\"detail\":\"Post your creative builds for The Sims 4 community.\"}]",
    downloadsEnabled: true,
    allowedFileTypes: ["zip"],
    filterGroups: [
      {
        key: "size",
        displayName: "Size",
        mode: FilterMode.Include,
        order: 0,
        options: [
          { value: "20x15", displayName: "20 x 15", order: 0 },
          { value: "20x20", displayName: "20 x 20", order: 1 },
          { value: "30x20", displayName: "30 x 20", order: 2 },
          { value: "30x30", displayName: "30 x 30", order: 3 },
          { value: "40x20", displayName: "40 x 20", order: 4 },
          { value: "40x30", displayName: "40 x 30", order: 5 },
          { value: "40x40", displayName: "40 x 40", order: 6 },
          { value: "50x40", displayName: "50 x 40", order: 7 },
          { value: "50x50", displayName: "50 x 50", order: 8 },
          { value: "64x64", displayName: "64 x 64", order: 9 },
        ]
      },
      {
        key: "price",
        displayName: "Price",
        mode: FilterMode.Include,
        order: 1,
        options: [
          { value: "0-10k", displayName: "0 - 10,000", order: 0 },
          { value: "10k-20k", displayName: "10,000 - 20,000", order: 1 },
          { value: "20k-40k", displayName: "20,000 - 40,000", order: 2 },
          { value: "40k-80k", displayName: "40,000 - 80,000", order: 3 },
          { value: "80k-150k", displayName: "80,000 - 150,000", order: 4 },
          { value: "150k-plus", displayName: "150,000+", order: 5 },
        ]
      },
      {
        key: "lot_type",
        displayName: "Lot type",
        mode: FilterMode.Include,
        order: 2,
        options: [
          { value: "residential", displayName: "Residential", order: 0 },
          { value: "haunted_house_residential", displayName: "Haunted House Residential", order: 1 },
          { value: "tiny_home_residential", displayName: "Tiny Home Residential", order: 2 },
          { value: "arts_center", displayName: "Arts Center", order: 3 },
          { value: "bar", displayName: "Bar", order: 4 },
          { value: "beach", displayName: "Beach", order: 5 },
          { value: "cafe", displayName: "Cafe", order: 6 },
          { value: "community_garden", displayName: "Community Garden", order: 7 },
          { value: "community_space", displayName: "Community Space", order: 8 },
          { value: "foxbury_commons", displayName: "Foxbury Commons", order: 9 },
          { value: "generic", displayName: "Generic", order: 10 },
          { value: "gym", displayName: "Gym", order: 11 },
          { value: "karaoke", displayName: "Karaoke", order: 12 },
          { value: "library", displayName: "Library", order: 13 },
          { value: "lounge", displayName: "Lounge", order: 14 },
          { value: "maker_space", displayName: "Maker Space", order: 15 },
          { value: "marketplace", displayName: "Marketplace", order: 16 },
          { value: "museum", displayName: "Museum", order: 17 },
          { value: "national_park", displayName: "National Park", order: 18 },
          { value: "nightclub", displayName: "Nightclub", order: 19 },
          { value: "onsen_bathhouse", displayName: "Onsen Bathhouse", order: 20 },
          { value: "park", displayName: "Park", order: 21 },
          { value: "pool", displayName: "Pool", order: 22 },
          { value: "recreation_center", displayName: "Recreation Center", order: 23 },
          { value: "restaurant", displayName: "Restaurant", order: 24 },
          { value: "retail", displayName: "Retail", order: 25 },
          { value: "spa", displayName: "Spa", order: 26 },
          { value: "thrift_bubble_tea", displayName: "Thrift and Bubble Tea Store", order: 27 },
          { value: "ubrite_commons", displayName: "UBrite Commons", order: 28 },
          { value: "university_housing", displayName: "University Housing", order: 29 },
          { value: "vet_clinic", displayName: "Vet Clinic", order: 30 },
          { value: "wedding_venue", displayName: "Wedding Venue", order: 31 },
        ]
      },
      {
        key: "advanced",
        displayName: "Advanced",
        mode: FilterMode.Include,
        order: 3,
        options: [
          { value: "custom_content", displayName: "Include Custom Content", order: 0 },
        ]
      },
    ]
  },
];

const channels: ChannelCreateInput[] = baseChannels.map(
  ({ uniqueName, admins, mods, rules, downloadsEnabled, allowedFileTypes, filterGroups }): ChannelCreateInput => ({
    uniqueName,
    rules,
    wikiEnabled: true,
    downloadsEnabled: downloadsEnabled || false,
    allowedFileTypes: allowedFileTypes || [],
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
             displayName: mod,
          }
        },
      })),
    },
    FilterGroups: filterGroups ? {
      create: filterGroups.map((group) => ({
        node: {
          id: `${uniqueName}_${group.key}`,
          key: group.key,
          displayName: group.displayName,
          mode: group.mode,
          order: group.order,
          options: {
            create: group.options.map((option) => ({
              node: {
                id: `${uniqueName}_${group.key}_${option.value}`,
                value: option.value,
                displayName: option.displayName,
                order: option.order,
              }
            }))
          }
        }
      }))
    } : undefined,
  })
);

export default channels;
import { FilterMode, type FilterGroup, type FilterOption } from '@/__generated__/graphql';
import { buildChannel, type ChannelFixture } from './graphqlFixtures';

export const SIMS4_BUILDS_CHANNEL_ID = 'sims4_builds';

type Sims4FilterOptionFixture = Pick<
  FilterOption,
  '__typename' | 'id' | 'value' | 'displayName' | 'order'
>;

export type Sims4FilterGroupFixture = Pick<
  FilterGroup,
  '__typename' | 'id' | 'key' | 'displayName' | 'mode' | 'order'
> & {
  options: Sims4FilterOptionFixture[];
};

type FilterGroupInput = {
  key: string;
  displayName: string;
  mode?: FilterMode;
  order: number;
  options: Array<{
    value: string;
    displayName: string;
    order: number;
  }>;
};

const sims4FilterGroupInputs: FilterGroupInput[] = [
  {
    key: 'size',
    displayName: 'Size',
    order: 0,
    options: [
      { value: '20x15', displayName: '20 x 15', order: 0 },
      { value: '20x20', displayName: '20 x 20', order: 1 },
      { value: '30x20', displayName: '30 x 20', order: 2 },
      { value: '30x30', displayName: '30 x 30', order: 3 },
      { value: '40x20', displayName: '40 x 20', order: 4 },
      { value: '40x30', displayName: '40 x 30', order: 5 },
      { value: '40x40', displayName: '40 x 40', order: 6 },
      { value: '50x40', displayName: '50 x 40', order: 7 },
      { value: '50x50', displayName: '50 x 50', order: 8 },
      { value: '64x64', displayName: '64 x 64', order: 9 },
    ],
  },
  {
    key: 'price',
    displayName: 'Price',
    order: 1,
    options: [
      { value: '0-10k', displayName: '0 - 10,000', order: 0 },
      { value: '10k-20k', displayName: '10,000 - 20,000', order: 1 },
      { value: '20k-40k', displayName: '20,000 - 40,000', order: 2 },
      { value: '40k-80k', displayName: '40,000 - 80,000', order: 3 },
      { value: '80k-150k', displayName: '80,000 - 150,000', order: 4 },
      { value: '150k-plus', displayName: '150,000+', order: 5 },
    ],
  },
  {
    key: 'lot_type',
    displayName: 'Lot type',
    order: 2,
    options: [
      { value: 'residential', displayName: 'Residential', order: 0 },
      {
        value: 'haunted_house_residential',
        displayName: 'Haunted House Residential',
        order: 1,
      },
      {
        value: 'tiny_home_residential',
        displayName: 'Tiny Home Residential',
        order: 2,
      },
      { value: 'arts_center', displayName: 'Arts Center', order: 3 },
      { value: 'bar', displayName: 'Bar', order: 4 },
      { value: 'beach', displayName: 'Beach', order: 5 },
      { value: 'cafe', displayName: 'Cafe', order: 6 },
      { value: 'community_garden', displayName: 'Community Garden', order: 7 },
      { value: 'community_space', displayName: 'Community Space', order: 8 },
      { value: 'foxbury_commons', displayName: 'Foxbury Commons', order: 9 },
      { value: 'generic', displayName: 'Generic', order: 10 },
      { value: 'gym', displayName: 'Gym', order: 11 },
      { value: 'karaoke', displayName: 'Karaoke', order: 12 },
      { value: 'library', displayName: 'Library', order: 13 },
      { value: 'lounge', displayName: 'Lounge', order: 14 },
      { value: 'maker_space', displayName: 'Maker Space', order: 15 },
      { value: 'marketplace', displayName: 'Marketplace', order: 16 },
      { value: 'museum', displayName: 'Museum', order: 17 },
      { value: 'national_park', displayName: 'National Park', order: 18 },
      { value: 'nightclub', displayName: 'Nightclub', order: 19 },
      { value: 'onsen_bathhouse', displayName: 'Onsen Bathhouse', order: 20 },
      { value: 'park', displayName: 'Park', order: 21 },
      { value: 'pool', displayName: 'Pool', order: 22 },
      { value: 'recreation_center', displayName: 'Recreation Center', order: 23 },
      { value: 'restaurant', displayName: 'Restaurant', order: 24 },
      { value: 'retail', displayName: 'Retail', order: 25 },
      { value: 'spa', displayName: 'Spa', order: 26 },
      {
        value: 'thrift_bubble_tea',
        displayName: 'Thrift and Bubble Tea Store',
        order: 27,
      },
      { value: 'ubrite_commons', displayName: 'UBrite Commons', order: 28 },
      {
        value: 'university_housing',
        displayName: 'University Housing',
        order: 29,
      },
      { value: 'vet_clinic', displayName: 'Vet Clinic', order: 30 },
      { value: 'wedding_venue', displayName: 'Wedding Venue', order: 31 },
    ],
  },
  {
    key: 'expansion_packs',
    displayName: 'Expansion packs',
    order: 3,
    options: [
      { value: 'get_to_work', displayName: 'Get to Work', order: 0 },
      { value: 'get_together', displayName: 'Get Together', order: 1 },
      { value: 'city_living', displayName: 'City Living', order: 2 },
      { value: 'cats_dogs', displayName: 'Cats & Dogs', order: 3 },
      { value: 'seasons', displayName: 'Seasons', order: 4 },
      { value: 'get_famous', displayName: 'Get Famous', order: 5 },
      { value: 'island_living', displayName: 'Island Living', order: 6 },
      {
        value: 'discover_university',
        displayName: 'Discover University',
        order: 7,
      },
      { value: 'eco_lifestyle', displayName: 'Eco Lifestyle', order: 8 },
      { value: 'snowy_escape', displayName: 'Snowy Escape', order: 9 },
      { value: 'cottage_living', displayName: 'Cottage Living', order: 10 },
      {
        value: 'high_school_years',
        displayName: 'High School Years',
        order: 11,
      },
      { value: 'growing_together', displayName: 'Growing Together', order: 12 },
      { value: 'horse_ranch', displayName: 'Horse Ranch', order: 13 },
      { value: 'for_rent', displayName: 'For Rent', order: 14 },
      { value: 'lovestruck', displayName: 'Lovestruck', order: 15 },
      { value: 'life_death', displayName: 'Life & Death', order: 16 },
      {
        value: 'businesses_hobbies',
        displayName: 'Businesses & Hobbies',
        order: 17,
      },
      {
        value: 'enchanted_by_nature',
        displayName: 'Enchanted by Nature',
        order: 18,
      },
    ],
  },
  {
    key: 'game_packs',
    displayName: 'Game packs',
    order: 4,
    options: [
      { value: 'outdoor_retreat', displayName: 'Outdoor retreat', order: 0 },
      { value: 'spa_day', displayName: 'Spa Day', order: 1 },
      { value: 'dine_out', displayName: 'Dine Out', order: 2 },
      { value: 'vampires', displayName: 'Vampires', order: 3 },
      { value: 'parenthood', displayName: 'Parenthood', order: 4 },
      { value: 'jungle_adventure', displayName: 'Jungle Adventure', order: 5 },
      { value: 'strangerville', displayName: 'Strangerville', order: 6 },
      { value: 'realm_of_magic', displayName: 'Realm of Magic', order: 7 },
      {
        value: 'journey_to_batuu',
        displayName: 'Journey to Batuu',
        order: 8,
      },
      {
        value: 'dream_home_decorator',
        displayName: 'Dream Home Decorator',
        order: 9,
      },
      {
        value: 'my_wedding_stories',
        displayName: 'My Wedding Stories',
        order: 10,
      },
      { value: 'werewolves', displayName: 'Werewolves', order: 11 },
    ],
  },
  {
    key: 'stuff_packs',
    displayName: 'Stuff packs',
    order: 5,
    options: [
      { value: 'movie_hangout', displayName: 'Movie Hangout', order: 0 },
      { value: 'romantic_garden', displayName: 'Romantic Garden', order: 1 },
      { value: 'kids_room', displayName: 'Kids Room', order: 2 },
      { value: 'backyard', displayName: 'Backyard', order: 3 },
      {
        value: 'vintage_glamour',
        displayName: 'Vintage Glamour Stuff',
        order: 4,
      },
      { value: 'bowling_night', displayName: 'Bowling Night', order: 5 },
      { value: 'fitness', displayName: 'Fitness', order: 6 },
      { value: 'toddler', displayName: 'Toddler', order: 7 },
      { value: 'laundry_day', displayName: 'Laundry Day', order: 8 },
      { value: 'my_first_pet', displayName: 'My First Pet', order: 9 },
      { value: 'moschino', displayName: 'Moschino', order: 10 },
      { value: 'tiny_living', displayName: 'Tiny Living', order: 11 },
      { value: 'nifty_knitting', displayName: 'Nifty Knitting', order: 12 },
      { value: 'paranormal', displayName: 'Paranormal', order: 13 },
      { value: 'home_chef_hustle', displayName: 'Home Chef Hustle', order: 14 },
      {
        value: 'crystal_creations',
        displayName: 'Crystal Creations',
        order: 15,
      },
    ],
  },
  {
    key: 'advanced',
    displayName: 'Advanced',
    order: 6,
    options: [
      {
        value: 'custom_content',
        displayName: 'Include Custom Content',
        order: 0,
      },
    ],
  },
];

export const sims4BuildsFilterGroups: Sims4FilterGroupFixture[] =
  sims4FilterGroupInputs.map((group) => ({
    __typename: 'FilterGroup',
    id: `${SIMS4_BUILDS_CHANNEL_ID}_${group.key}`,
    key: group.key,
    displayName: group.displayName,
    mode: group.mode ?? FilterMode.Include,
    order: group.order,
    options: group.options.map((option) => ({
      __typename: 'FilterOption',
      id: `${SIMS4_BUILDS_CHANNEL_ID}_${group.key}_${option.value}`,
      value: option.value,
      displayName: option.displayName,
      order: option.order,
    })),
  }));

export const buildSims4BuildsChannel = (
  overrides: Partial<ChannelFixture> = {}
): ChannelFixture =>
  buildChannel({
    uniqueName: SIMS4_BUILDS_CHANNEL_ID,
    displayName: 'Sims 4 Builds',
    description: 'Share Sims 4 builds with filters for lots and packs.',
    overrides: {
      downloadsEnabled: true,
      allowedFileTypes: ['zip'],
      FilterGroups: sims4BuildsFilterGroups as ChannelFixture['FilterGroups'],
      ...overrides,
    },
  });

const cloneFilterGroup = ({
  source,
  key,
  displayName,
  mode,
  order,
}: {
  source: Sims4FilterGroupFixture;
  key: string;
  displayName: string;
  mode: FilterMode;
  order: number;
}): Sims4FilterGroupFixture => ({
  ...source,
  id: `${SIMS4_BUILDS_CHANNEL_ID}_${key}`,
  key,
  displayName,
  mode,
  order,
  options: source.options.map((option) => ({
    ...option,
    id: `${SIMS4_BUILDS_CHANNEL_ID}_${key}_${option.value}`,
  })),
});

export const sims4PackPreferenceFilterGroups: Sims4FilterGroupFixture[] = [
  cloneFilterGroup({
    source: sims4BuildsFilterGroups.find((group) => group.key === 'game_packs')!,
    key: 'include_game_packs',
    displayName: 'Must include game packs',
    mode: FilterMode.Include,
    order: 0,
  }),
  cloneFilterGroup({
    source: sims4BuildsFilterGroups.find((group) => group.key === 'game_packs')!,
    key: 'exclude_game_packs',
    displayName: 'Must not include game packs',
    mode: FilterMode.Exclude,
    order: 1,
  }),
];

export const buildSims4PackPreferenceChannel = (
  overrides: Partial<ChannelFixture> = {}
): ChannelFixture =>
  buildSims4BuildsChannel({
    FilterGroups:
      sims4PackPreferenceFilterGroups as ChannelFixture['FilterGroups'],
    ...overrides,
  });

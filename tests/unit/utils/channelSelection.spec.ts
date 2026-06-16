import { describe, it, expect } from 'vitest';
import {
  areAllChannelsSelected,
  getChannelsToToggle,
  filterChannelsBySearch,
} from '@/utils/channelSelection';

describe('areAllChannelsSelected', () => {
  it('is true when every channel is selected', () => {
    expect(
      areAllChannelsSelected({
        channelNames: ['a', 'b'],
        selectedChannels: ['a', 'b', 'c'],
      })
    ).toBe(true);
  });

  it('is false when some channels are not selected', () => {
    expect(
      areAllChannelsSelected({
        channelNames: ['a', 'b'],
        selectedChannels: ['a'],
      })
    ).toBe(false);
  });

  it('is false for an empty channel list', () => {
    expect(
      areAllChannelsSelected({ channelNames: [], selectedChannels: ['a'] })
    ).toBe(false);
  });
});

describe('getChannelsToToggle', () => {
  it('returns the unselected channels when not all are selected', () => {
    expect(
      getChannelsToToggle({
        channelNames: ['a', 'b', 'c'],
        selectedChannels: ['a'],
      })
    ).toEqual(['b', 'c']);
  });

  it('returns the selected channels when all are selected (to deselect)', () => {
    expect(
      getChannelsToToggle({
        channelNames: ['a', 'b'],
        selectedChannels: ['a', 'b'],
      })
    ).toEqual(['a', 'b']);
  });

  it('returns nothing to toggle for an empty channel list', () => {
    expect(
      getChannelsToToggle({ channelNames: [], selectedChannels: ['a'] })
    ).toEqual([]);
  });
});

describe('filterChannelsBySearch', () => {
  const channels = [
    { uniqueName: 'cats', displayName: 'Cat Lovers' },
    { uniqueName: 'dogs', displayName: 'Dog Park' },
  ];

  it('returns all channels when the search term is empty', () => {
    expect(
      filterChannelsBySearch({ channels, searchTerm: '' })
    ).toEqual(channels);
  });

  it('matches on uniqueName case-insensitively', () => {
    expect(
      filterChannelsBySearch({ channels, searchTerm: 'CAT' }).map(
        (c) => c.uniqueName
      )
    ).toEqual(['cats']);
  });

  it('matches on displayName', () => {
    expect(
      filterChannelsBySearch({ channels, searchTerm: 'park' }).map(
        (c) => c.uniqueName
      )
    ).toEqual(['dogs']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterChannelsBySearch({ channels, searchTerm: 'zzz' })).toEqual([]);
  });
});

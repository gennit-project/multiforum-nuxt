import { describe, it, expect } from 'vitest';
import {
  areAllChannelsSelected,
  getChannelsToToggle,
  filterChannelsBySearch,
} from './channelSelection';

describe('areAllChannelsSelected', () => {
  it('is true when every channel is selected', () => {
    expect(
      areAllChannelsSelected({
        channelNames: ['a', 'b'],
        selectedChannels: ['a', 'b'],
      })
    ).toBe(true);
  });

  it('is false when some channel is unselected', () => {
    expect(
      areAllChannelsSelected({ channelNames: ['a', 'b'], selectedChannels: ['a'] })
    ).toBe(false);
  });

  it('is false when there are no channels', () => {
    expect(
      areAllChannelsSelected({ channelNames: [], selectedChannels: [] })
    ).toBe(false);
  });
});

describe('getChannelsToToggle', () => {
  it('returns the unselected channels when not all are selected', () => {
    expect(
      getChannelsToToggle({ channelNames: ['a', 'b', 'c'], selectedChannels: ['a'] })
    ).toEqual(['b', 'c']);
  });

  it('returns all selected channels when everything is selected (to deselect)', () => {
    expect(
      getChannelsToToggle({ channelNames: ['a', 'b'], selectedChannels: ['a', 'b'] })
    ).toEqual(['a', 'b']);
  });
});

describe('filterChannelsBySearch', () => {
  const channels = [
    { uniqueName: 'cats', displayName: 'Cats' },
    { uniqueName: 'dogs', displayName: 'Doggos' },
  ];

  it('returns all channels for an empty search term', () => {
    expect(filterChannelsBySearch({ channels, searchTerm: '' })).toBe(channels);
  });

  it('matches on display name case-insensitively', () => {
    expect(
      filterChannelsBySearch({ channels, searchTerm: 'dog' }).map((c) => c.uniqueName)
    ).toEqual(['dogs']);
  });
});

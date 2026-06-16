import { describe, it, expect, vi } from 'vitest';
import { useSelectedChannelsFromQuery } from './useSelectedChannelsFromQuery';

const mockRoute: { query: Record<string, unknown> } = { query: {} };

vi.mock('nuxt/app', () => ({
  useRoute: () => mockRoute,
}));

const withQuery = (channels: unknown) => {
  mockRoute.query = { channels };
  return useSelectedChannelsFromQuery();
};

describe('useSelectedChannelsFromQuery', () => {
  describe('selectedChannels', () => {
    it('wraps a single string channel in an array', () => {
      const { selectedChannels } = withQuery('cats');
      expect(selectedChannels.value).toEqual(['cats']);
    });

    it('returns an empty array for an empty string', () => {
      const { selectedChannels } = withQuery('');
      expect(selectedChannels.value).toEqual([]);
    });

    it('returns an array of string channels as-is', () => {
      const { selectedChannels } = withQuery(['cats', 'dogs']);
      expect(selectedChannels.value).toEqual(['cats', 'dogs']);
    });

    it('filters out null and empty entries from an array', () => {
      const { selectedChannels } = withQuery(['cats', null, '', 'dogs']);
      expect(selectedChannels.value).toEqual(['cats', 'dogs']);
    });

    it('returns an empty array when there is no channels query', () => {
      mockRoute.query = {};
      const { selectedChannels } = useSelectedChannelsFromQuery();
      expect(selectedChannels.value).toEqual([]);
    });
  });

  describe('hasSelectedChannels', () => {
    it('is true when channels are selected', () => {
      const { hasSelectedChannels } = withQuery('cats');
      expect(hasSelectedChannels.value).toBe(true);
    });

    it('is false when no channels are selected', () => {
      mockRoute.query = {};
      const { hasSelectedChannels } = useSelectedChannelsFromQuery();
      expect(hasSelectedChannels.value).toBe(false);
    });
  });
});

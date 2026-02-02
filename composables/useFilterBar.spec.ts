import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { DEFAULT_FILTER_LABELS } from './useFilterBar';

// Mock the router utils
vi.mock('@/utils/routerUtils', () => ({
  updateFilters: vi.fn(),
}));

// Mock the label utils
vi.mock('@/utils', () => ({
  getChannelLabel: vi.fn((channels: string[]) =>
    channels.length > 0 ? channels.join(', ') : 'All Forums'
  ),
  getTagLabel: vi.fn((tags: string[]) =>
    tags.length > 0 ? tags.join(', ') : 'Tags'
  ),
}));

// Mock nuxt/app router
const mockRoute = {
  params: { forumId: 'test-forum' },
  query: {},
  name: 'test-route',
  path: '/test',
};

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
};

vi.mock('nuxt/app', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}));

describe('useFilterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.params = { forumId: 'test-forum' };
    mockRoute.query = {};
  });

  describe('DEFAULT_FILTER_LABELS', () => {
    it('should have correct default channel label', () => {
      expect(DEFAULT_FILTER_LABELS.channels).toBe('All Forums');
    });

    it('should have correct default tags label', () => {
      expect(DEFAULT_FILTER_LABELS.tags).toBe('Tags');
    });
  });

  describe('composable initialization', () => {
    it('should export DEFAULT_FILTER_LABELS constant', async () => {
      const { DEFAULT_FILTER_LABELS: labels } = await import('./useFilterBar');
      expect(labels).toBeDefined();
      expect(labels.channels).toBe('All Forums');
      expect(labels.tags).toBe('Tags');
    });

    it('should export useFilterBar function', async () => {
      const { useFilterBar } = await import('./useFilterBar');
      expect(typeof useFilterBar).toBe('function');
    });
  });

  describe('channelId extraction', () => {
    it('should extract channelId from route params when forumId is a string', async () => {
      mockRoute.params = { forumId: 'my-forum' };

      const { useFilterBar } = await import('./useFilterBar');
      const mockGetFilterValues = vi.fn(() => ({
        channels: [],
        tags: [],
        searchInput: '',
      }));

      const result = useFilterBar({
        getFilterValuesFromParams: mockGetFilterValues,
      });

      expect(result.channelId.value).toBe('my-forum');
    });

    it('should return empty string when forumId is not in params', async () => {
      mockRoute.params = {};

      const { useFilterBar } = await import('./useFilterBar');
      const mockGetFilterValues = vi.fn(() => ({
        channels: [],
        tags: [],
        searchInput: '',
      }));

      const result = useFilterBar({
        getFilterValuesFromParams: mockGetFilterValues,
      });

      expect(result.channelId.value).toBe('');
    });
  });

  describe('filter value management', () => {
    it('should call getFilterValuesFromParams with route and channelId', async () => {
      mockRoute.params = { forumId: 'test-forum' };

      const { useFilterBar } = await import('./useFilterBar');
      const mockGetFilterValues = vi.fn(() => ({
        channels: ['forum1'],
        tags: ['tag1'],
        searchInput: 'test',
      }));

      useFilterBar({
        getFilterValuesFromParams: mockGetFilterValues,
      });

      expect(mockGetFilterValues).toHaveBeenCalledWith(
        expect.objectContaining({
          route: mockRoute,
          channelId: 'test-forum',
        })
      );
    });

    it('should initialize filterValues with result from getFilterValuesFromParams', async () => {
      const { useFilterBar } = await import('./useFilterBar');
      const initialValues = {
        channels: ['forum1', 'forum2'],
        tags: ['tag1'],
        searchInput: 'search text',
        showArchived: true,
      };

      const mockGetFilterValues = vi.fn(() => initialValues);

      const result = useFilterBar({
        getFilterValuesFromParams: mockGetFilterValues,
      });

      expect(result.filterValues.value).toEqual(initialValues);
    });
  });

  describe('label computation', () => {
    it('should compute channelLabel based on filterValues.channels', async () => {
      const { useFilterBar } = await import('./useFilterBar');
      const { getChannelLabel } = await import('@/utils');

      const mockGetFilterValues = vi.fn(() => ({
        channels: ['forum1', 'forum2'],
        tags: [],
      }));

      const result = useFilterBar({
        getFilterValuesFromParams: mockGetFilterValues,
      });

      // The mock returns channels joined
      expect(result.channelLabel.value).toBe('forum1, forum2');
      expect(getChannelLabel).toHaveBeenCalledWith(['forum1', 'forum2']);
    });

    it('should compute tagLabel based on filterValues.tags', async () => {
      const { useFilterBar } = await import('./useFilterBar');
      const { getTagLabel } = await import('@/utils');

      const mockGetFilterValues = vi.fn(() => ({
        channels: [],
        tags: ['tag1', 'tag2'],
      }));

      const result = useFilterBar({
        getFilterValuesFromParams: mockGetFilterValues,
      });

      expect(result.tagLabel.value).toBe('tag1, tag2');
      expect(getTagLabel).toHaveBeenCalledWith(['tag1', 'tag2']);
    });
  });

  describe('toggle functions', () => {
    it('should add channel when toggling non-selected channel', async () => {
      const { useFilterBar } = await import('./useFilterBar');
      const { updateFilters } = await import('@/utils/routerUtils');

      const mockGetFilterValues = vi.fn(() => ({
        channels: ['forum1'],
        tags: [],
      }));

      const result = useFilterBar({
        getFilterValuesFromParams: mockGetFilterValues,
      });

      result.toggleSelectedChannel('forum2');

      expect(result.filterValues.value.channels).toContain('forum2');
      expect(updateFilters).toHaveBeenCalled();
    });

    it('should remove channel when toggling already-selected channel', async () => {
      const { useFilterBar } = await import('./useFilterBar');
      const { updateFilters } = await import('@/utils/routerUtils');

      const mockGetFilterValues = vi.fn(() => ({
        channels: ['forum1', 'forum2'],
        tags: [],
      }));

      const result = useFilterBar({
        getFilterValuesFromParams: mockGetFilterValues,
      });

      result.toggleSelectedChannel('forum1');

      expect(result.filterValues.value.channels).not.toContain('forum1');
      expect(updateFilters).toHaveBeenCalled();
    });

    it('should add tag when toggling non-selected tag', async () => {
      const { useFilterBar } = await import('./useFilterBar');
      const { updateFilters } = await import('@/utils/routerUtils');

      const mockGetFilterValues = vi.fn(() => ({
        channels: [],
        tags: ['tag1'],
      }));

      const result = useFilterBar({
        getFilterValuesFromParams: mockGetFilterValues,
      });

      result.toggleSelectedTag('tag2');

      expect(result.filterValues.value.tags).toContain('tag2');
      expect(updateFilters).toHaveBeenCalled();
    });

    it('should remove tag when toggling already-selected tag', async () => {
      const { useFilterBar } = await import('./useFilterBar');
      const { updateFilters } = await import('@/utils/routerUtils');

      const mockGetFilterValues = vi.fn(() => ({
        channels: [],
        tags: ['tag1', 'tag2'],
      }));

      const result = useFilterBar({
        getFilterValuesFromParams: mockGetFilterValues,
      });

      result.toggleSelectedTag('tag1');

      expect(result.filterValues.value.tags).not.toContain('tag1');
      expect(updateFilters).toHaveBeenCalled();
    });
  });

  describe('update functions', () => {
    it('should call updateFilters with search input', async () => {
      const { useFilterBar } = await import('./useFilterBar');
      const { updateFilters } = await import('@/utils/routerUtils');

      const mockGetFilterValues = vi.fn(() => ({
        channels: [],
        tags: [],
        searchInput: '',
      }));

      const result = useFilterBar({
        getFilterValuesFromParams: mockGetFilterValues,
      });

      result.updateSearchInput('new search');

      expect(updateFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { searchInput: 'new search' },
        })
      );
    });

    it('should call updateFilters with generic filter value', async () => {
      const { useFilterBar } = await import('./useFilterBar');
      const { updateFilters } = await import('@/utils/routerUtils');

      const mockGetFilterValues = vi.fn(() => ({
        channels: [],
        tags: [],
      }));

      const result = useFilterBar({
        getFilterValuesFromParams: mockGetFilterValues,
      });

      result.updateFilter('customFilter', 'customValue');

      expect(updateFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { customFilter: 'customValue' },
        })
      );
    });

    it('should clear filter when clearIfFalsy is true and value is falsy', async () => {
      const { useFilterBar } = await import('./useFilterBar');
      const { updateFilters } = await import('@/utils/routerUtils');

      const mockGetFilterValues = vi.fn(() => ({
        channels: [],
        tags: [],
      }));

      const result = useFilterBar({
        getFilterValuesFromParams: mockGetFilterValues,
      });

      result.updateFilter('myFilter', '', true);

      expect(updateFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { myFilter: undefined },
        })
      );
    });
  });

  describe('returned values', () => {
    it('should return all expected properties', async () => {
      const { useFilterBar } = await import('./useFilterBar');
      const mockGetFilterValues = vi.fn(() => ({
        channels: [],
        tags: [],
      }));

      const result = useFilterBar({
        getFilterValuesFromParams: mockGetFilterValues,
      });

      // Check routing
      expect(result.route).toBeDefined();
      expect(result.router).toBeDefined();
      expect(result.channelId).toBeDefined();

      // Check filter state
      expect(result.filterValues).toBeDefined();

      // Check labels
      expect(result.channelLabel).toBeDefined();
      expect(result.tagLabel).toBeDefined();

      // Check functions
      expect(typeof result.setSelectedChannels).toBe('function');
      expect(typeof result.setSelectedTags).toBe('function');
      expect(typeof result.updateSearchInput).toBe('function');
      expect(typeof result.updateShowArchived).toBe('function');
      expect(typeof result.updateFilter).toBe('function');
      expect(typeof result.toggleSelectedChannel).toBe('function');
      expect(typeof result.toggleSelectedTag).toBe('function');

      // Check constants
      expect(result.defaultFilterLabels).toEqual(DEFAULT_FILTER_LABELS);
    });
  });
});

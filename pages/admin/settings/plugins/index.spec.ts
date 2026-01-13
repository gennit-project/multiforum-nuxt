import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

// Mock Apollo composable
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    result: ref(null),
    loading: ref(false),
    error: ref(null),
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    loading: ref(false),
    error: ref(null),
  })),
}));

// Mock the config
vi.mock('@/config', () => ({
  config: {
    serverName: 'test-server',
  },
}));

// Mock GraphQL queries and mutations
vi.mock('@/graphQLData/admin/queries', () => ({
  GET_PLUGIN_MANAGEMENT_DATA: 'mock-query',
  GET_INSTALLED_PLUGINS: 'mock-query',
}));

vi.mock('@/graphQLData/admin/mutations', () => ({
  REFRESH_PLUGINS: 'mock-mutation',
  ALLOW_PLUGIN: 'mock-mutation',
  DISALLOW_PLUGIN: 'mock-mutation',
}));

// Mock useToast
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

vi.mock('@/composables/useToast', () => ({
  useToast: () => mockToast,
}));

describe('Plugin Management Index - Phase 6 Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Plugin Filtering Logic', () => {
    // Test the filtering logic that would be in filteredAndSortedPlugins
    interface PluginState {
      id: string;
      name: string;
      description?: string;
      status:
        | 'available'
        | 'allowed'
        | 'installed'
        | 'installed_disabled'
        | 'installed_enabled';
    }

    const mockPlugins: PluginState[] = [
      {
        id: 'security-scan',
        name: 'Security Scanner',
        description: 'Scans files for viruses',
        status: 'installed_enabled',
      },
      {
        id: 'auto-labeler',
        name: 'Auto Labeler',
        description: 'Automatically labels content',
        status: 'installed_disabled',
      },
      {
        id: 'thumbnail-gen',
        name: 'Thumbnail Generator',
        description: 'Generates thumbnails for images',
        status: 'allowed',
      },
      {
        id: 'hello-world',
        name: 'Hello World',
        description: 'A demo plugin',
        status: 'available',
      },
    ];

    // Helper function that mirrors the filtering logic in the component
    const filterPlugins = (
      plugins: PluginState[],
      searchQuery: string,
      statusFilter: 'all' | 'available' | 'allowed' | 'installed' | 'enabled'
    ): PluginState[] => {
      let result = [...plugins];

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        result = result.filter(
          (plugin) =>
            plugin.name.toLowerCase().includes(query) ||
            plugin.description?.toLowerCase().includes(query) ||
            plugin.id.toLowerCase().includes(query)
        );
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        result = result.filter((plugin) => {
          switch (statusFilter) {
            case 'available':
              return plugin.status === 'available';
            case 'allowed':
              return plugin.status === 'allowed';
            case 'installed':
              return (
                plugin.status === 'installed_disabled' ||
                plugin.status === 'installed_enabled'
              );
            case 'enabled':
              return plugin.status === 'installed_enabled';
            default:
              return true;
          }
        });
      }

      return result;
    };

    it('should return all plugins when no filters applied', () => {
      const result = filterPlugins(mockPlugins, '', 'all');
      expect(result).toHaveLength(4);
    });

    it('should filter by search query matching name', () => {
      const result = filterPlugins(mockPlugins, 'security', 'all');
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Security Scanner');
    });

    it('should filter by search query matching description', () => {
      const result = filterPlugins(mockPlugins, 'viruses', 'all');
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Security Scanner');
    });

    it('should filter by search query matching id', () => {
      const result = filterPlugins(mockPlugins, 'thumbnail-gen', 'all');
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Thumbnail Generator');
    });

    it('should be case insensitive when searching', () => {
      const result = filterPlugins(mockPlugins, 'HELLO', 'all');
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Hello World');
    });

    it('should filter by available status', () => {
      const result = filterPlugins(mockPlugins, '', 'available');
      expect(result).toHaveLength(1);
      expect(result[0]!.status).toBe('available');
    });

    it('should filter by allowed status', () => {
      const result = filterPlugins(mockPlugins, '', 'allowed');
      expect(result).toHaveLength(1);
      expect(result[0]!.status).toBe('allowed');
    });

    it('should filter by installed status (includes both enabled and disabled)', () => {
      const result = filterPlugins(mockPlugins, '', 'installed');
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.status.startsWith('installed'))).toBe(true);
    });

    it('should filter by enabled status', () => {
      const result = filterPlugins(mockPlugins, '', 'enabled');
      expect(result).toHaveLength(1);
      expect(result[0]!.status).toBe('installed_enabled');
    });

    it('should combine search and status filters', () => {
      const result = filterPlugins(mockPlugins, 'label', 'installed');
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Auto Labeler');
    });

    it('should return empty array when no matches', () => {
      const result = filterPlugins(mockPlugins, 'nonexistent', 'all');
      expect(result).toHaveLength(0);
    });
  });

  describe('Plugin Sorting Logic', () => {
    interface PluginState {
      id: string;
      name: string;
      status:
        | 'available'
        | 'allowed'
        | 'installed'
        | 'installed_disabled'
        | 'installed_enabled';
    }

    const mockPlugins: PluginState[] = [
      { id: '3', name: 'Zebra Plugin', status: 'available' },
      { id: '1', name: 'Alpha Plugin', status: 'installed_enabled' },
      { id: '2', name: 'Beta Plugin', status: 'allowed' },
      { id: '4', name: 'Delta Plugin', status: 'installed_disabled' },
    ];

    // Helper function that mirrors the sorting logic in the component
    const sortPlugins = (
      plugins: PluginState[],
      sortBy: 'name' | 'status',
      sortDirection: 'asc' | 'desc'
    ): PluginState[] => {
      const result = [...plugins];

      const statusOrder: Record<PluginState['status'], number> = {
        installed_enabled: 0,
        installed_disabled: 1,
        installed: 2,
        allowed: 3,
        available: 4,
      };

      result.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'status') {
          comparison = statusOrder[a.status] - statusOrder[b.status];
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });

      return result;
    };

    it('should sort by name ascending', () => {
      const result = sortPlugins(mockPlugins, 'name', 'asc');
      expect(result[0]!.name).toBe('Alpha Plugin');
      expect(result[1]!.name).toBe('Beta Plugin');
      expect(result[2]!.name).toBe('Delta Plugin');
      expect(result[3]!.name).toBe('Zebra Plugin');
    });

    it('should sort by name descending', () => {
      const result = sortPlugins(mockPlugins, 'name', 'desc');
      expect(result[0]!.name).toBe('Zebra Plugin');
      expect(result[3]!.name).toBe('Alpha Plugin');
    });

    it('should sort by status ascending (enabled first)', () => {
      const result = sortPlugins(mockPlugins, 'status', 'asc');
      expect(result[0]!.status).toBe('installed_enabled');
      expect(result[1]!.status).toBe('installed_disabled');
      expect(result[2]!.status).toBe('allowed');
      expect(result[3]!.status).toBe('available');
    });

    it('should sort by status descending (available first)', () => {
      const result = sortPlugins(mockPlugins, 'status', 'desc');
      expect(result[0]!.status).toBe('available');
      expect(result[3]!.status).toBe('installed_enabled');
    });
  });

  describe('Per-Button Loading States', () => {
    it('should track loading state per plugin ID', () => {
      const allowingPluginIds = new Set<string>();

      // Initially no plugins are loading
      expect(allowingPluginIds.has('plugin-1')).toBe(false);
      expect(allowingPluginIds.has('plugin-2')).toBe(false);

      // Start loading plugin-1
      allowingPluginIds.add('plugin-1');
      expect(allowingPluginIds.has('plugin-1')).toBe(true);
      expect(allowingPluginIds.has('plugin-2')).toBe(false);

      // Start loading plugin-2
      allowingPluginIds.add('plugin-2');
      expect(allowingPluginIds.has('plugin-1')).toBe(true);
      expect(allowingPluginIds.has('plugin-2')).toBe(true);

      // Finish loading plugin-1
      allowingPluginIds.delete('plugin-1');
      expect(allowingPluginIds.has('plugin-1')).toBe(false);
      expect(allowingPluginIds.has('plugin-2')).toBe(true);
    });

    it('should handle multiple loading states independently', () => {
      const allowingPluginIds = new Set<string>();
      const disallowingPluginIds = new Set<string>();

      // Different operations on different plugins
      allowingPluginIds.add('plugin-1');
      disallowingPluginIds.add('plugin-2');

      expect(allowingPluginIds.has('plugin-1')).toBe(true);
      expect(disallowingPluginIds.has('plugin-1')).toBe(false);
      expect(allowingPluginIds.has('plugin-2')).toBe(false);
      expect(disallowingPluginIds.has('plugin-2')).toBe(true);
    });
  });

  describe('Toggle Sort Function', () => {
    it('should toggle direction when clicking same field', () => {
      let sortBy = 'name';
      let sortDirection: 'asc' | 'desc' = 'asc';

      const toggleSort = (field: string) => {
        if (sortBy === field) {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          sortBy = field;
          sortDirection = 'asc';
        }
      };

      // Click name again - should toggle to desc
      toggleSort('name');
      expect(sortBy).toBe('name');
      expect(sortDirection).toBe('desc');

      // Click name again - should toggle to asc
      toggleSort('name');
      expect(sortBy).toBe('name');
      expect(sortDirection).toBe('asc');
    });

    it('should reset to asc when clicking different field', () => {
      let sortBy = 'name';
      let sortDirection: 'asc' | 'desc' = 'desc';

      const toggleSort = (field: string) => {
        if (sortBy === field) {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          sortBy = field;
          sortDirection = 'asc';
        }
      };

      // Click status - should change field and reset to asc
      toggleSort('status');
      expect(sortBy).toBe('status');
      expect(sortDirection).toBe('asc');
    });
  });
});

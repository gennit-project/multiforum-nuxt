import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref, type Ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { usePluginConfigStatus } from './usePluginConfigStatus';

const h = vi.hoisted(() => ({
  query: null as unknown as {
    result: Ref<unknown>;
    loading: Ref<boolean>;
    error: Ref<Error | null>;
    refetch: ReturnType<typeof vi.fn>;
  },
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.query = {
    result: ref(null),
    loading: ref(false),
    error: ref(null),
    refetch: vi.fn(),
  };
  return {
    useQuery: vi.fn(() => h.query),
  };
});

vi.mock('@/graphQLData/admin/queries', () => ({
  GET_PLUGIN_CONFIG_STATUS: 'CONFIG_STATUS',
}));

describe('usePluginConfigStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.query.result.value = null;
    h.query.loading.value = false;
    h.query.error.value = null;
  });

  it('passes reactive plugin, version, and scope variables to the query', async () => {
    const pluginId = ref('example-plugin');
    const version = ref('1.0.0');
    const scope = ref<'server' | 'channel'>('server');

    usePluginConfigStatus({ pluginId, version, scope });
    const queryVariables = vi.mocked(useQuery).mock.calls[0]![1] as {
      value: Record<string, string>;
    };

    pluginId.value = 'other-plugin';
    version.value = '2.0.0';
    scope.value = 'channel';
    await nextTick();

    expect(queryVariables.value).toEqual({
      pluginId: 'other-plugin',
      version: '2.0.0',
      scope: 'channel',
    });
  });

  it.each([
    {
      name: 'missing plugin ID',
      pluginId: '',
      version: '1.0.0',
    },
    {
      name: 'missing version',
      pluginId: 'example-plugin',
      version: '',
    },
  ])('disables the query for $name', ({ pluginId, version }) => {
    usePluginConfigStatus({
      pluginId: ref(pluginId),
      version: ref(version),
      scope: 'server',
    });
    const queryOptions = vi.mocked(useQuery).mock.calls[0]![2] as {
      enabled: { value: boolean };
    };

    expect(queryOptions.enabled.value).toBe(false);
  });

  it('clears exposed status when a required query input disappears', async () => {
    const version = ref('1.0.0');
    h.query.result.value = {
      getPluginConfigStatus: {
        isFullyConfigured: true,
        fields: [],
      },
    };
    const { status, isFullyConfigured } = usePluginConfigStatus({
      pluginId: 'example-plugin',
      version,
      scope: 'server',
    });

    version.value = '';
    await nextTick();

    expect({
      status: status.value,
      isFullyConfigured: isFullyConfigured.value,
    }).toEqual({
      status: null,
      isFullyConfigured: false,
    });
  });

  it('derives every required missing or invalid blocking field', () => {
    h.query.result.value = {
      getPluginConfigStatus: {
        isFullyConfigured: false,
        fields: [
          {
            key: 'missing',
            label: 'Missing',
            scope: 'server',
            kind: 'SETTING',
            required: true,
            isSet: false,
            isValid: false,
          },
          {
            key: 'invalid',
            label: 'Invalid',
            scope: 'server',
            kind: 'SECRET',
            required: true,
            isSet: true,
            isValid: false,
          },
          {
            key: 'optional',
            label: 'Optional',
            scope: 'server',
            kind: 'SETTING',
            required: false,
            isSet: false,
            isValid: false,
          },
          {
            key: 'valid',
            label: 'Valid',
            scope: 'server',
            kind: 'SETTING',
            required: true,
            isSet: true,
            isValid: true,
          },
        ],
      },
    };
    const { blockingFields } = usePluginConfigStatus({
      pluginId: 'example-plugin',
      version: '1.0.0',
      scope: 'server',
    });

    expect(blockingFields.value.map(({ key }) => key)).toEqual([
      'missing',
      'invalid',
    ]);
  });

  it('exposes the query refetch operation', async () => {
    const { refetch } = usePluginConfigStatus({
      pluginId: 'example-plugin',
      version: '1.0.0',
      scope: 'server',
    });

    await refetch();

    expect(h.query.refetch).toHaveBeenCalledOnce();
  });
});

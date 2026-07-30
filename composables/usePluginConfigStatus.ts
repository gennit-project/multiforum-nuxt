import {
  computed,
  toValue,
  type MaybeRefOrGetter,
} from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_PLUGIN_CONFIG_STATUS } from '@/graphQLData/admin/queries';
import type { PluginConfigFieldKind } from '@/types/pluginForms';

export type PluginConfigScope = 'server' | 'channel';

export interface PluginConfigFieldStatus {
  key: string;
  label: string;
  scope: PluginConfigScope;
  kind: PluginConfigFieldKind;
  required: boolean;
  isSet: boolean;
  isValid: boolean;
  message?: string | null;
}

export interface PluginConfigStatus {
  isFullyConfigured: boolean;
  fields: PluginConfigFieldStatus[];
}

interface UsePluginConfigStatusOptions {
  pluginId: MaybeRefOrGetter<string | null | undefined>;
  version: MaybeRefOrGetter<string | null | undefined>;
  scope: MaybeRefOrGetter<PluginConfigScope>;
}

export function usePluginConfigStatus({
  pluginId,
  version,
  scope,
}: UsePluginConfigStatusOptions) {
  const queryVariables = computed(() => ({
    pluginId: toValue(pluginId) || '',
    version: toValue(version) || '',
    scope: toValue(scope),
  }));

  const queryEnabled = computed(
    () => !!queryVariables.value.pluginId && !!queryVariables.value.version
  );

  const {
    result,
    loading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery(GET_PLUGIN_CONFIG_STATUS, queryVariables, {
    enabled: queryEnabled,
    fetchPolicy: 'cache-and-network',
  });

  const status = computed<PluginConfigStatus | null>(() => {
    if (!queryEnabled.value) return null;
    return result.value?.getPluginConfigStatus || null;
  });

  const blockingFields = computed<PluginConfigFieldStatus[]>(() =>
    (status.value?.fields || []).filter(
      (field) => field.required && (!field.isSet || !field.isValid)
    )
  );

  const isFullyConfigured = computed(
    () => status.value?.isFullyConfigured === true
  );

  const loading = computed(() => queryEnabled.value && queryLoading.value);
  const error = computed(() =>
    queryEnabled.value ? queryError.value : null
  );

  return {
    status,
    isFullyConfigured,
    blockingFields,
    loading,
    error,
    refetch,
  };
}

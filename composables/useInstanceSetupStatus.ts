import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_INSTANCE_SETUP_STATUS } from '@/graphQLData/admin/queries';

export const instanceCapabilityKeys = [
  'auth',
  'mail',
  'maps',
  'geocoding',
  'uploads',
  'downloads',
  'events',
  'plugins',
] as const;

export type InstanceCapabilityKey = (typeof instanceCapabilityKeys)[number];

export interface InstanceCapabilityStatus {
  configured: boolean;
  enabled: boolean;
  requiredEnvVarsMissing: string[];
  setupUrl: string;
  docsPath: string;
}

export type InstanceSetupStatus = Record<
  InstanceCapabilityKey,
  InstanceCapabilityStatus
>;

interface InstanceSetupQueryResult {
  getInstanceSetupStatus: InstanceSetupStatus;
}

export function useInstanceSetupStatus() {
  const { result, loading, error, refetch } =
    useQuery<InstanceSetupQueryResult>(GET_INSTANCE_SETUP_STATUS, undefined, {
      fetchPolicy: 'cache-and-network',
    });

  const status = computed(() => result.value?.getInstanceSetupStatus ?? null);

  return { status, loading, error, refetch };
}

export function useInstanceCapability(key: InstanceCapabilityKey) {
  const setup = useInstanceSetupStatus();
  const capability = computed(() => setup.status.value?.[key] ?? null);
  const available = computed(
    () =>
      capability.value?.configured === true &&
      capability.value?.enabled === true
  );

  return { ...setup, capability, available };
}

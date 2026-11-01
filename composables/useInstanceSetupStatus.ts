import type { GetInstanceSetupStatusQuery } from '@/__generated__/operations';
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GetInstanceSetupStatusDocument as GET_INSTANCE_SETUP_STATUS } from '@/__generated__/operations';

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

export type InstanceSetupStatus = GetInstanceSetupStatusQuery['getInstanceSetupStatus'];
export type InstanceCapabilityStatus = InstanceSetupStatus[InstanceCapabilityKey];

export function useInstanceSetupStatus() {
  const { result, loading, error, refetch } =
    useQuery(GET_INSTANCE_SETUP_STATUS, undefined, {
      fetchPolicy: 'cache-and-network',
      // Capability checks control interaction-only features such as uploads,
      // maps, and geocoding. Fetch them after hydration instead of delaying
      // every SSR page that happens to mount one of those controls.
      prefetch: false,
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

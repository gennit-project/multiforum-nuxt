import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_INSTANCE_SETUP_STATUS } from '@/graphQLData/admin/queries';
import { useInstanceSetupStatus } from './useInstanceSetupStatus';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

const mockedUseQuery = vi.mocked(useQuery);

describe('useInstanceSetupStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries the public capability endpoint and exposes its status', () => {
    const capabilityStatus = {
      auth: {
        configured: false,
        enabled: false,
        requiredEnvVarsMissing: ['AUTH0_DOMAIN'],
        setupUrl: '/admin/setup#authentication',
        docsPath: '/authentication',
      },
    };
    const refetch = vi.fn();
    mockedUseQuery.mockReturnValue({
      result: ref({ getInstanceSetupStatus: capabilityStatus }),
      loading: ref(false),
      error: ref(null),
      refetch,
    } as never);

    const setup = useInstanceSetupStatus();

    expect(mockedUseQuery).toHaveBeenCalledWith(
      GET_INSTANCE_SETUP_STATUS,
      undefined,
      { fetchPolicy: 'cache-and-network' }
    );
    expect(setup.status.value).toEqual(capabilityStatus);
    expect(setup.refetch).toBe(refetch);
  });

  it('returns null before the setup status has loaded', () => {
    mockedUseQuery.mockReturnValue({
      result: ref(undefined),
      loading: ref(true),
      error: ref(null),
      refetch: vi.fn(),
    } as never);

    const setup = useInstanceSetupStatus();

    expect(setup.status.value).toBeNull();
    expect(setup.loading.value).toBe(true);
  });
});

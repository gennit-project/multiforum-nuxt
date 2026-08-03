import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import InstanceSetupPage from './setup.vue';

const harness = vi.hoisted(() => ({
  status: null as unknown,
  loading: null as unknown,
  error: null as unknown,
  refetch: vi.fn(),
}));

vi.mock('@/composables/useInstanceSetupStatus', async () => {
  const actual = await vi.importActual('@/composables/useInstanceSetupStatus');
  return {
    ...actual,
    useInstanceSetupStatus: () => ({
      status: harness.status,
      loading: harness.loading,
      error: harness.error,
      refetch: harness.refetch,
    }),
  };
});

const capability = (
  configured: boolean,
  enabled: boolean,
  missing: string[] = []
) => ({
  configured,
  enabled,
  requiredEnvVarsMissing: missing,
  setupUrl: '/admin/setup#authentication',
  docsPath: '/authentication',
});

describe('admin instance setup page', () => {
  beforeEach(() => {
    harness.status = ref({
      auth: capability(false, false, ['AUTH0_DOMAIN']),
      mail: capability(true, true),
      maps: capability(true, false),
      geocoding: capability(true, true),
      uploads: capability(true, true),
      downloads: capability(true, true),
      events: capability(true, true),
      plugins: capability(true, true),
    });
    harness.loading = ref(false);
    harness.error = ref(null);
    harness.refetch.mockClear();
  });

  it('renders all capabilities and their readiness states', () => {
    const wrapper = mountWithDefaults(InstanceSetupPage);

    expect(wrapper.findAll('section')).toHaveLength(8);
    expect(wrapper.get('[data-testid="setup-state-auth"]').text()).toBe(
      'Setup required'
    );
    expect(wrapper.get('[data-testid="setup-state-mail"]').text()).toBe(
      'Ready'
    );
    expect(wrapper.get('[data-testid="setup-state-maps"]').text()).toBe(
      'Configured, disabled'
    );
    expect(wrapper.text()).toContain('AUTH0_DOMAIN');
  });

  it('builds documentation links from backend-provided paths', () => {
    const wrapper = mountWithDefaults(InstanceSetupPage);

    expect(wrapper.get('section a').attributes('href')).toBe(
      'https://docs.multiforum.net/authentication'
    );
  });

  it('shows a loading state before status is available', () => {
    harness.status = ref(null);
    harness.loading = ref(true);
    const wrapper = mountWithDefaults(InstanceSetupPage);

    expect(wrapper.text()).toContain('Checking instance capabilities...');
  });

  it('offers to retry when the query fails', async () => {
    harness.status = ref(null);
    harness.error = ref(new Error('unsupported query'));
    const wrapper = mountWithDefaults(InstanceSetupPage);

    expect(wrapper.text()).toContain('Setup status is unavailable');
    await wrapper.get('button').trigger('click');
    expect(harness.refetch).toHaveBeenCalledOnce();
  });
});

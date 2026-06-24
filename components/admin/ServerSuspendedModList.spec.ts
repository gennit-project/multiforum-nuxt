import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ServerSuspendedModList from '@/components/admin/ServerSuspendedModList.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  loading: null as unknown,
  error: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.result, loading: h.loading, error: h.error }),
}));

const suspension = (overrides: Record<string, unknown> = {}) => ({
  id: 's1',
  SuspendedMod: { displayName: 'mod1' },
  username: 'alice',
  suspendedIndefinitely: false,
  suspendedUntil: '2024-06-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const withMods = (list: unknown[], count?: number) => ({
  serverConfigs: [{ SuspendedMods: list, SuspendedModsAggregate: { count: count ?? list.length } }],
});

const mountList = () =>
  mount(ServerSuspendedModList, {
    global: {
      stubs: {
        AvatarComponent: true,
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref(withMods([suspension()]));
  h.loading = ref(false);
  h.error = ref(null);
});

describe('ServerSuspendedModList states', () => {
  it('shows a loading message', () => {
    h.loading = ref(true);
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Loading');
  });

  it('shows an error banner', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountList();

    expect(wrapper.find('.err').text()).toContain('boom');
  });

  it('shows the empty message when there are none', () => {
    h.result = ref(withMods([]));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('no active server-scoped mod suspensions');
  });
});

describe('ServerSuspendedModList content', () => {
  it('shows the active suspension count', () => {
    h.result = ref(withMods([suspension()], 1));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Active Suspensions (1)');
  });

  it('shows the mod name and username', () => {
    const wrapper = mountList();

    expect(wrapper.text()).toContain('mod1 (alice)');
  });

  it('shows a suspended-until date for a temporary suspension', () => {
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Suspended until');
  });

  it('shows an indefinite-suspension message', () => {
    h.result = ref(withMods([suspension({ suspendedIndefinitely: true })]));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Suspended indefinitely');
  });

  it('links to the related issue when present', () => {
    h.result = ref(withMods([suspension({ RelatedIssue: { issueNumber: 9 } })]));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Related Issue');
  });
});

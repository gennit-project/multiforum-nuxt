import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import SuspendedModList from '@/components/channel/form/SuspendedModList.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  loading: null as unknown,
  error: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.result, loading: h.loading, error: h.error }),
}));
vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: { forumId: 'cats' } }) }));

const suspension = (overrides: Record<string, unknown> = {}) => ({
  username: 'alice',
  SuspendedMod: { displayName: 'mod1' },
  suspendedIndefinitely: false,
  suspendedUntil: '2024-06-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const withSuspensions = (list: unknown[], count?: number) => ({
  channels: [{ SuspendedMods: list, SuspendedModsAggregate: { count: count ?? list.length } }],
});

const mountList = () =>
  mount(SuspendedModList, {
    global: {
      stubs: {
        AvatarComponent: true,
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref(withSuspensions([suspension()]));
  h.loading = ref(false);
  h.error = ref(null);
});

describe('SuspendedModList states', () => {
  it('shows a loading message', () => {
    h.loading = ref(true);
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Loading');
  });

  it('shows an error message', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Error');
  });

  it('shows an empty message when there are no suspensions', () => {
    h.result = ref(withSuspensions([]));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('no active mod suspensions');
  });
});

describe('SuspendedModList content', () => {
  it('shows the active suspension count', () => {
    h.result = ref(withSuspensions([suspension()], 1));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Active Suspensions (1)');
  });

  it('shows the suspended mod name and username', () => {
    const wrapper = mountList();

    expect(wrapper.text()).toContain('mod1 (alice)');
  });

  it('shows a suspended-until date for a temporary suspension', () => {
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Suspended until');
  });

  it('shows an indefinite-suspension message', () => {
    h.result = ref(withSuspensions([suspension({ suspendedIndefinitely: true })]));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Suspended indefinitely');
  });

  it('links to the related issue when present', () => {
    h.result = ref(withSuspensions([suspension({ RelatedIssue: { issueNumber: 9 } })]));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Related Issue');
  });
});

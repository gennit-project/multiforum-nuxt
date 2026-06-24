import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ScratchpadSection from '@/components/scratchpad/ScratchpadSection.vue';

const h = vi.hoisted(() => ({
  // useQuery: [0] public, [1] pending.
  publicResult: null as unknown,
  publicLoading: null as unknown,
  publicError: null as unknown,
  refetchPublic: vi.fn(),
  pendingResult: null as unknown,
  pendingLoading: null as unknown,
  pendingError: null as unknown,
  refetchPending: vi.fn(),
  index: { n: 0 },
  username: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () =>
    h.index.n++ === 0
      ? { result: h.publicResult, loading: h.publicLoading, error: h.publicError, refetch: h.refetchPublic }
      : { result: h.pendingResult, loading: h.pendingLoading, error: h.pendingError, refetch: h.refetchPending },
}));
vi.mock('@/composables/useAuthState', () => ({ useUsername: () => h.username }));

const entries = (ids: string[]) => ({ scratchpadEntries: ids.map((id) => ({ id })) });

const entryStub = {
  name: 'ScratchpadEntry',
  props: ['entry', 'isOwner'],
  emits: ['updated', 'deleted'],
  template: '<div class="entry" />',
};

const mountSection = (props: Record<string, unknown> = {}) =>
  mount(ScratchpadSection, {
    props: { username: 'alice', ...props },
    global: {
      stubs: {
        ScratchpadEntry: entryStub,
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.index.n = 0;
  h.publicResult = ref(entries(['p1']));
  h.publicLoading = ref(false);
  h.publicError = ref(null);
  h.pendingResult = ref(entries([]));
  h.pendingLoading = ref(false);
  h.pendingError = ref(null);
  h.username = ref('alice');
});

describe('ScratchpadSection states', () => {
  it('shows a spinner while loading', () => {
    h.publicLoading = ref(true);
    const wrapper = mountSection();

    expect(wrapper.find('.fa-spinner').exists()).toBe(true);
  });

  it('shows an error banner on public query error', () => {
    h.publicError = ref({ message: 'boom' });
    const wrapper = mountSection();

    expect(wrapper.find('.err').text()).toContain('boom');
  });

  it('shows the owner empty state', () => {
    h.publicResult = ref(entries([]));
    const wrapper = mountSection();

    expect(wrapper.text()).toContain('their thank-you note will appear here');
  });

  it('shows the visitor empty state', () => {
    h.publicResult = ref(entries([]));
    h.username = ref('bob');
    const wrapper = mountSection();

    expect(wrapper.text()).toContain("hasn't received any public scratchpad entries");
  });
});

describe('ScratchpadSection entries', () => {
  it('renders public entries', () => {
    const wrapper = mountSection();

    expect(wrapper.findAllComponents(entryStub)).toHaveLength(1);
  });

  it('shows pending entries to the owner', () => {
    h.pendingResult = ref(entries(['x1', 'x2']));
    const wrapper = mountSection();

    expect(wrapper.text()).toContain('Pending Entries');
  });

  it('hides pending entries from visitors', () => {
    h.pendingResult = ref(entries(['x1']));
    h.username = ref('bob');
    const wrapper = mountSection();

    expect(wrapper.text()).not.toContain('Pending Entries');
  });

  it('marks public entries as owned for the owner', () => {
    const wrapper = mountSection();

    expect(wrapper.getComponent(entryStub).props('isOwner')).toBe(true);
  });
});

describe('ScratchpadSection refetch', () => {
  it('refetches public and pending after an entry update', async () => {
    const wrapper = mountSection();

    await wrapper.getComponent(entryStub).vm.$emit('updated');

    expect(h.refetchPublic).toHaveBeenCalled();
  });

  it('refetches pending too when the owner updates an entry', async () => {
    const wrapper = mountSection();

    await wrapper.getComponent(entryStub).vm.$emit('updated');

    expect(h.refetchPending).toHaveBeenCalled();
  });

  it('refetches after an entry is deleted', async () => {
    const wrapper = mountSection();

    await wrapper.getComponent(entryStub).vm.$emit('deleted');

    expect(h.refetchPublic).toHaveBeenCalled();
  });
});

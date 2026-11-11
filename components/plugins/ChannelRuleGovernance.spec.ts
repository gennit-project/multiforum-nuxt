import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import ChannelRuleGovernance from './ChannelRuleGovernance.vue';

vi.mock('@/__generated__/operations', () => ({
  GetChannelRuleGovernanceDocument: 'STATUS',
  SetChannelRuleEnforcementDocument: 'SET',
  RequestChannelRuleEnforcementDocument: 'REQUEST',
}));
const mock = vi.hoisted(() => ({
  result: null as any,
  loading: null as any,
  error: null as any,
  saving: null as any,
  requesting: null as any,
  saveError: null as any,
  requestError: null as any,
  set: vi.fn(),
  request: vi.fn(),
  refetch: vi.fn(),
  saved: vi.fn(),
  requested: vi.fn(),
}));
vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: mock.result,
    loading: mock.loading,
    error: mock.error,
    refetch: mock.refetch,
  }),
  useMutation: (doc: string) =>
    doc === 'SET'
      ? {
          mutate: mock.set,
          loading: mock.saving,
          error: mock.saveError,
          onDone: (cb: () => void) => {
            mock.saved = cb;
          },
        }
      : {
          mutate: mock.request,
          loading: mock.requesting,
          error: mock.requestError,
          onDone: (cb: () => void) => {
            mock.requested = cb;
          },
        },
}));
const base = () => ({
  pluginId: 'llm-moderation',
  version: '0.4.0',
  serverRuleEnforcement: 'on',
  channelRuleEligibility: 'all',
  channelRuleAllowlist: [],
  eligible: true,
  ownerEnabled: false,
  canRequest: false,
  pendingRequestId: null,
  pendingRequestNumber: null,
  migrationRequired: false,
});
const status = () => mock.result.value.getChannelRuleGovernance;
const mountPanel = () =>
  mountWithDefaults(ChannelRuleGovernance, {
    props: { channelUniqueName: 'cats', pluginId: 'llm-moderation' },
  });
beforeEach(() => {
  vi.clearAllMocks();
  mock.result = ref({ getChannelRuleGovernance: base() });
  mock.loading = ref(false);
  mock.error = ref(null);
  mock.saving = ref(false);
  mock.requesting = ref(false);
  mock.saveError = ref(null);
  mock.requestError = ref(null);
});

describe('channel rule governance', () => {
  it('does not leave a rejected opt-in checked in the native input', async () => {
    const wrapper = mountPanel();
    await wrapper.get('input').setValue(true);
    mock.saveError.value = new Error('Permission denied');
    await nextTick();
    expect((wrapper.get('input').element as HTMLInputElement).checked).toBe(
      false
    );
  });

  it('shows server enforcement as informational text, not an owner control', () => {
    const wrapper = mountPanel();
    expect({
      text: wrapper.text().includes('Only server admins can change this'),
      controls: wrapper.findAll('input').length,
    }).toEqual({ text: true, controls: 1 });
  });
  it('opts in using the dedicated mutation', async () => {
    await mountPanel().get('input').setValue(true);
    expect(mock.set).toHaveBeenCalledWith({
      channelUniqueName: 'cats',
      pluginId: 'llm-moderation',
      enabled: true,
    });
  });
  it.each(['none', 'allowlist'])(
    'blocks an ineligible opt-in under %s',
    (policy) => {
      Object.assign(status(), {
        eligible: false,
        channelRuleEligibility: policy,
      });
      expect(mountPanel().get('input').attributes('disabled')).toBeDefined();
    }
  );
  it('allows withdrawal of a previously saved opt-in after eligibility changes', async () => {
    Object.assign(status(), {
      ownerEnabled: true,
      eligible: false,
      channelRuleEligibility: 'none',
    });
    await mountPanel().get('input').setValue(false);
    expect(mock.set).toHaveBeenCalledWith({
      channelUniqueName: 'cats',
      pluginId: 'llm-moderation',
      enabled: false,
    });
  });
  it('requests eligibility without enabling enforcement', async () => {
    Object.assign(status(), {
      eligible: false,
      canRequest: true,
      channelRuleEligibility: 'allowlist',
    });
    await mountPanel().get('button').trigger('click');
    expect({
      request: mock.request.mock.calls,
      set: mock.set.mock.calls,
    }).toEqual({
      request: [[{ channelUniqueName: 'cats', pluginId: 'llm-moderation' }]],
      set: [],
    });
  });
  it('links a pending request to the server issue and suppresses duplicates', () => {
    Object.assign(status(), {
      eligible: false,
      canRequest: false,
      pendingRequestId: 'request-7',
      pendingRequestNumber: 7,
    });
    const wrapper = mountPanel();
    expect({
      href: wrapper.get('a').attributes('href'),
      requestButtons: wrapper.findAll('button').length,
    }).toEqual({ href: '/server/issues/7', requestButtons: 0 });
  });
  it('blocks repeat requests while a mutation is running', () => {
    Object.assign(status(), { eligible: false, canRequest: true });
    mock.requesting.value = true;
    expect(mountPanel().get('button').attributes('disabled')).toBeDefined();
  });
  it('keeps failed mutation errors visible and retryable', () => {
    Object.assign(status(), { eligible: false, canRequest: true });
    mock.requestError.value = new Error('Permission denied');
    const wrapper = mountPanel();
    expect({
      error: wrapper.get('[role="alert"]').text(),
      disabled: wrapper.get('button').attributes('disabled'),
    }).toEqual({ error: 'Permission denied', disabled: undefined });
  });
  it('does not expose stale controls after a query error', () => {
    mock.error.value = new Error('Forbidden');
    expect(mountPanel().findAll('input')).toHaveLength(0);
  });
  it('refetches after success instead of optimistically claiming opt-in', async () => {
    const wrapper = mountPanel();
    mock.saved({ data: { setChannelRuleEnforcement: true } });
    await nextTick();
    expect({
      refetches: mock.refetch.mock.calls.length,
      checked: (wrapper.get('input').element as HTMLInputElement).checked,
      changes: wrapper.emitted('changed')?.length,
    }).toEqual({ refetches: 1, checked: false, changes: 1 });
  });
  it('states that approval still requires owner opt-in', async () => {
    const wrapper = mountPanel();
    mock.requested({
      data: { requestChannelRuleEnforcement: { id: 'request-1' } },
    });
    await nextTick();
    expect(wrapper.text()).toContain(
      'Approval makes this forum eligible; you can then enable its rules.'
    );
  });
});

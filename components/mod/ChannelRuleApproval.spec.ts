import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ChannelRuleApproval from './ChannelRuleApproval.vue';

const mockMutation = vi.hoisted(() => ({
  mutate: vi.fn(),
  done: null as null | ((result: any) => void),
  update: null as null | ((cache: any, result: any) => void),
}));
const mockLoading = ref(false);
const mockError = ref<Error | null>(null);
vi.mock('@vue/apollo-composable', () => ({
  useMutation: (_document: unknown, options: any) => {
    mockMutation.update = options.update;
    return {
      mutate: mockMutation.mutate,
      loading: mockLoading,
      error: mockError,
      onDone: (callback: (result: any) => void) => {
        mockMutation.done = callback;
      },
      onError: vi.fn(),
    };
  },
}));
const issue = {
  id: 'request-1',
  isOpen: true,
  channelUniqueName: null,
  relatedChannelUniqueName: 'cats',
  requestKind: 'CHANNEL_RULE_ENFORCEMENT',
  requestedPluginId: 'llm-moderation',
};
const mountApproval = (overrides = {}, canManagePlugins = true) =>
  mount(ChannelRuleApproval, {
    props: { issue: { ...issue, ...overrides }, canManagePlugins },
    global: { stubs: { ClientOnly: { template: '<slot />' } } },
  });
beforeEach(() => {
  mockMutation.mutate.mockReset();
  mockLoading.value = false;
  mockError.value = null;
});
describe('ChannelRuleApproval', () => {
  it('submits only the issue ID to the authoritative approval mutation', async () => {
    const wrapper = mountApproval();
    await wrapper.get('button').trigger('click');
    expect(mockMutation.mutate).toHaveBeenCalledWith({ issueId: 'request-1' });
  });
  it('does not offer approval without plugin-management capability', () => {
    expect(mountApproval({}, false).find('button').exists()).toBe(false);
  });
  it.each([
    { requestKind: null },
    { requestedPluginId: 'other' },
    { channelUniqueName: 'cats' },
    { relatedChannelUniqueName: null },
  ])('does not expose approval for unrelated issues: %j', (overrides) => {
    expect(mountApproval(overrides).find('section').exists()).toBe(false);
  });
  it('does not offer approval for a closed request', () => {
    expect(mountApproval({ isOpen: false }).find('button').exists()).toBe(
      false
    );
  });
  it('blocks repeated submission while approval is pending', async () => {
    const wrapper = mountApproval();
    mockLoading.value = true;
    await wrapper.vm.$nextTick();
    await wrapper.get('button').trigger('click');
    expect(mockMutation.mutate).not.toHaveBeenCalled();
  });
  it('announces successful approval and removes the submit button', async () => {
    const wrapper = mountApproval();
    mockMutation.done?.({
      data: {
        approveChannelRuleEnforcement: { id: 'request-1', isOpen: false },
      },
    });
    await wrapper.vm.$nextTick();
    expect({
      status: wrapper.get('[role="status"]').text(),
      button: wrapper.find('button').exists(),
      emitted: wrapper.emitted('approved')?.length,
    }).toEqual({
      status: 'Forum-rule enforcement eligibility approved.',
      button: false,
      emitted: 1,
    });
  });
  it('refreshes eligibility and lists and closes only the approved issue in cache', () => {
    mountApproval();
    const cache = {
      identify: vi.fn(() => 'Issue:request-1'),
      modify: vi.fn(),
      evict: vi.fn(),
    };
    mockMutation.update?.(cache, {
      data: {
        approveChannelRuleEnforcement: { id: 'request-1', isOpen: false },
      },
    });
    expect({
      issue: cache.identify.mock.calls[0],
      open: cache.modify.mock.calls[0]?.[0].fields.isOpen(),
      invalidated: cache.evict.mock.calls.map(([value]) => value.fieldName),
    }).toEqual({
      issue: [{ __typename: 'Issue', id: 'request-1' }],
      open: false,
      invalidated: ['getChannelRuleGovernance', 'getSiteWideIssueList'],
    });
  });

  it('does not announce success for an invalid response', async () => {
    const wrapper = mountApproval();
    mockMutation.done?.({ data: null });
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('approved')).toBeUndefined();
  });
  it('shows backend rejection and leaves approval available for retry', async () => {
    const wrapper = mountApproval();
    mockError.value = new Error('Request is no longer eligible');
    await wrapper.vm.$nextTick();
    expect({
      error: wrapper.get('[role="alert"]').text(),
      enabled: !wrapper.get('button').attributes('disabled'),
    }).toEqual({ error: 'Request is no longer eligible', enabled: true });
  });
});

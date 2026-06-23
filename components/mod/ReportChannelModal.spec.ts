import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ReportChannelModal from '@/components/mod/ReportChannelModal.vue';

const h = vi.hoisted(() => ({
  rulesResult: null as unknown,
  rulesLoading: null as unknown,
  rulesError: null as unknown,
  report: vi.fn(),
  reportError: { value: null as unknown },
  onDone: undefined as undefined | (() => void),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: h.rulesResult,
    loading: h.rulesLoading,
    error: h.rulesError,
  }),
  useMutation: () => ({
    mutate: h.report,
    loading: ref(false),
    error: h.reportError,
    onDone: (cb: () => void) => {
      h.onDone = cb;
    },
  }),
}));

const rules = (list: { summary: string; detail: string }[]) =>
  ref({ serverConfigs: [{ rules: JSON.stringify(list) }] });

const mountModal = (props: Record<string, unknown> = {}) =>
  mount(ReportChannelModal, {
    props: { channelUniqueName: 'cats', open: true, ...props },
    global: {
      stubs: {
        GenericModal: {
          name: 'GenericModal',
          props: ['title', 'open', 'primaryButtonDisabled', 'error'],
          emits: ['primary-button-click', 'close'],
          template: '<div><slot name="content" /></div>',
        },
        TextEditor: { name: 'TextEditor', props: ['initialValue'], emits: ['update'], template: '<div />' },
        BrokenRuleListItem: {
          name: 'BrokenRuleListItem',
          props: ['rule', 'selected'],
          emits: ['toggle-selection'],
          template: '<div />',
        },
        FlagIcon: true,
      },
    },
  });

const modal = (w: ReturnType<typeof mount>) => w.getComponent({ name: 'GenericModal' });

beforeEach(() => {
  vi.clearAllMocks();
  h.rulesResult = rules([{ summary: 'No spam', detail: 'd1' }]);
  h.rulesLoading = ref(false);
  h.rulesError = ref(null);
  h.reportError = { value: null };
  h.onDone = undefined;
});

describe('ReportChannelModal rules', () => {
  it('shows a loading state while rules load', () => {
    h.rulesLoading = ref(true);
    const wrapper = mountModal();

    expect(wrapper.text()).toContain('Loading');
  });

  it('shows an error when rules fail to load', () => {
    h.rulesError = ref({ message: 'rules boom' });
    const wrapper = mountModal();

    expect(wrapper.text()).toContain('rules boom');
  });

  it('renders a list item per server rule', () => {
    h.rulesResult = rules([
      { summary: 'No spam', detail: 'd1' },
      { summary: 'Be nice', detail: 'd2' },
    ]);
    const wrapper = mountModal();

    expect(wrapper.findAllComponents({ name: 'BrokenRuleListItem' })).toHaveLength(2);
  });

  it('shows a message when no rules are configured', () => {
    h.rulesResult = rules([]);
    const wrapper = mountModal();

    expect(wrapper.text()).toContain('No server rules configured');
  });
});

describe('ReportChannelModal title', () => {
  it('prefers the display name', () => {
    const wrapper = mountModal({ channelDisplayName: 'Cats Forum' });

    expect(modal(wrapper).props('title')).toContain('Cats Forum');
  });
});

describe('ReportChannelModal submit', () => {
  it('disables submit until a rule is selected', () => {
    const wrapper = mountModal();

    expect(modal(wrapper).props('primaryButtonDisabled')).toBe(true);
  });

  it('enables submit after selecting a rule', async () => {
    const wrapper = mountModal();

    await wrapper.getComponent({ name: 'BrokenRuleListItem' }).vm.$emit('toggle-selection');

    expect(modal(wrapper).props('primaryButtonDisabled')).toBe(false);
  });

  it('submits the report with the selected rules', async () => {
    const wrapper = mountModal();
    await wrapper.getComponent({ name: 'BrokenRuleListItem' }).vm.$emit('toggle-selection');

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.report).toHaveBeenCalledWith({
      channelUniqueName: 'cats',
      reportText: '',
      selectedServerRules: ['No spam'],
    });
  });

  it('does not submit when no rule is selected', async () => {
    const wrapper = mountModal();

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.report).not.toHaveBeenCalled();
  });
});

describe('ReportChannelModal lifecycle', () => {
  it('emits success when the report completes', () => {
    const wrapper = mountModal();

    h.onDone?.();

    expect(wrapper.emitted('reportSubmittedSuccessfully')).toBeTruthy();
  });

  it('emits close when dismissed', async () => {
    const wrapper = mountModal();

    await modal(wrapper).vm.$emit('close');

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import SelectBrokenRules from '@/components/admin/SelectBrokenRules.vue';

const h = vi.hoisted(() => ({
  // useQuery is called twice: [0] server rules, [1] channel rules.
  serverResult: null as unknown,
  serverError: null as unknown,
  serverLoading: null as unknown,
  channelResult: null as unknown,
  channelError: null as unknown,
  channelLoading: null as unknown,
  index: { n: 0 },
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () =>
    h.index.n++ === 0
      ? { result: h.serverResult, error: h.serverError, loading: h.serverLoading }
      : { result: h.channelResult, error: h.channelError, loading: h.channelLoading },
}));
vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: { forumId: 'cats' } }) }));

const ruleJSON = (summaries: string[]) =>
  JSON.stringify(summaries.map((s) => ({ summary: s, detail: `${s} detail` })));

const ruleItemStub = {
  name: 'BrokenRuleListItem',
  props: ['rule', 'selected'],
  emits: ['toggle-selection'],
  template: '<div class="rule">{{ rule.summary }}</div>',
};

const mountRules = () =>
  mount(SelectBrokenRules, {
    global: {
      stubs: {
        BrokenRuleListItem: ruleItemStub,
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
      },
    },
  });

const buttonByText = (w: ReturnType<typeof mount>, text: string) =>
  w.findAll('button').find((b) => b.text().includes(text));

beforeEach(() => {
  vi.clearAllMocks();
  h.index.n = 0;
  h.serverResult = ref({ serverConfigs: [{ rules: ruleJSON(['No spam']) }] });
  h.serverError = ref(null);
  h.serverLoading = ref(false);
  h.channelResult = ref({ channels: [{ rules: ruleJSON(['Be nice']) }] });
  h.channelError = ref(null);
  h.channelLoading = ref(false);
});

describe('SelectBrokenRules states', () => {
  it('shows a loading message', () => {
    h.channelLoading = ref(true);
    const wrapper = mountRules();

    expect(wrapper.text()).toContain('Loading');
  });

  it('shows an error banner on query error', () => {
    h.serverError = ref({ message: 'boom', graphQLErrors: [] });
    const wrapper = mountRules();

    expect(wrapper.find('.err').text()).toContain('boom');
  });
});

describe('SelectBrokenRules forum rules', () => {
  it('renders the forum rules', () => {
    const wrapper = mountRules();

    expect(wrapper.text()).toContain('Be nice');
  });

  it('emits toggleForumRuleSelection with the rule summary', async () => {
    const wrapper = mountRules();

    await wrapper.getComponent(ruleItemStub).vm.$emit('toggle-selection');

    expect(wrapper.emitted('toggleForumRuleSelection')?.[0]).toEqual(['Be nice']);
  });

  it('ignores unparseable rules JSON', () => {
    h.channelResult = ref({ channels: [{ rules: 'not json' }] });
    const wrapper = mountRules();

    expect(wrapper.text()).not.toContain('Be nice');
  });
});

describe('SelectBrokenRules server rules', () => {
  it('hides server rules behind a toggle when forum rules exist', () => {
    const wrapper = mountRules();

    expect(wrapper.text()).not.toContain('No spam');
  });

  it('reveals server rules when the toggle is clicked', async () => {
    const wrapper = mountRules();

    await buttonByText(wrapper, 'Show Server Rules')!.trigger('click');

    expect(wrapper.text()).toContain('No spam');
  });

  it('shows server rules by default when there are no forum rules', () => {
    h.channelResult = ref({ channels: [{ rules: ruleJSON([]) }] });
    const wrapper = mountRules();

    expect(wrapper.text()).toContain('No spam');
  });

  it('emits toggleServerRuleSelection with the rule summary', async () => {
    h.channelResult = ref({ channels: [{ rules: ruleJSON([]) }] });
    const wrapper = mountRules();

    await wrapper.getComponent(ruleItemStub).vm.$emit('toggle-selection');

    expect(wrapper.emitted('toggleServerRuleSelection')?.[0]).toEqual(['No spam']);
  });
});

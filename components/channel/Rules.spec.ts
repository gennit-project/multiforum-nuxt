import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import Rules from '@/components/channel/Rules.vue';

const rulesJSON = (rules: { summary: string; detail: string }[]) => JSON.stringify(rules);

const mountRules = (rules?: string) =>
  mount(Rules, {
    props: { rules },
    global: {
      stubs: {
        MarkdownRenderer: { name: 'MarkdownRenderer', props: ['text'], template: '<div class="md">{{ text }}</div>' },
      },
    },
  });

describe('Rules rendering', () => {
  it('renders a row per rule', () => {
    const wrapper = mountRules(
      rulesJSON([
        { summary: 'Be nice', detail: 'No insults' },
        { summary: 'No spam', detail: '' },
      ])
    );

    expect(wrapper.text()).toContain('Be nice');
  });

  it('numbers the rules', () => {
    const wrapper = mountRules(rulesJSON([{ summary: 'Be nice', detail: '' }]));

    expect(wrapper.text()).toContain('1.');
  });

  it('renders nothing for unparseable rules', () => {
    const wrapper = mountRules('not json');

    expect(wrapper.text()).toBe('');
  });

  it('renders nothing when there are no rules', () => {
    const wrapper = mountRules();

    expect(wrapper.text()).toBe('');
  });
});

describe('Rules expansion', () => {
  it('expands a rule with detail on click', async () => {
    const wrapper = mountRules(rulesJSON([{ summary: 'Be nice', detail: 'No insults' }]));

    await wrapper.find('.cursor-pointer').trigger('click');

    expect(wrapper.find('.md').text()).toBe('No insults');
  });

  it('collapses an expanded rule on a second click', async () => {
    const wrapper = mountRules(rulesJSON([{ summary: 'Be nice', detail: 'No insults' }]));
    await wrapper.find('.cursor-pointer').trigger('click');

    await wrapper.find('.cursor-pointer').trigger('click');

    expect(wrapper.find('.md').exists()).toBe(false);
  });

  it('does not make a detail-less rule clickable', () => {
    const wrapper = mountRules(rulesJSON([{ summary: 'No spam', detail: '' }]));

    expect(wrapper.find('.cursor-pointer').exists()).toBe(false);
  });
});

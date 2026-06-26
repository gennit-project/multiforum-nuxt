import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BrokenRuleListItem from './BrokenRuleListItem.vue';

const rule = { summary: 'No spam', detail: 'Do not post spam.' };

const mountItem = (selected: string[] = []) =>
  mount(BrokenRuleListItem, {
    props: { rule, selected },
    global: {
      stubs: { MarkdownRenderer: { template: '<div class="md"><slot /></div>' } },
    },
  });

describe('BrokenRuleListItem', () => {
  it('renders the rule summary', () => {
    expect(mountItem().text()).toContain('No spam');
  });

  it('checks the box when the rule is selected', () => {
    expect(
      (mountItem(['No spam']).find('input').element as HTMLInputElement).checked
    ).toBe(true);
  });

  it('emits toggleSelection with the rule summary on change', async () => {
    const wrapper = mountItem();
    await wrapper.find('input').trigger('change');
    expect(wrapper.emitted('toggleSelection')?.[0]).toEqual(['No spam']);
  });

  it('hides the detail until "See More" is clicked', () => {
    expect(mountItem().find('.md').exists()).toBe(false);
  });

  it('reveals the detail when "See More" is clicked', async () => {
    const wrapper = mountItem();
    await wrapper.get('[data-testid="forum-picker-Do not post spam."]').trigger('click');
    expect(wrapper.find('.md').exists()).toBe(true);
  });
});

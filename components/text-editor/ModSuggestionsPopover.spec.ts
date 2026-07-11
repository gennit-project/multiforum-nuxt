import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ModSuggestionsPopover from './ModSuggestionsPopover.vue';
import type { ModSuggestion } from '@/utils/modMentions';

const suggestion = (overrides: Partial<ModSuggestion> = {}): ModSuggestion => ({
  value: 'mod-1',
  label: 'Mod One',
  mention: '@mod-one',
  username: 'modone',
  ...overrides,
});

const three: ModSuggestion[] = [
  suggestion({ value: 'a', mention: '@a', username: 'alpha' }),
  suggestion({ value: 'b', mention: '@b', username: 'bravo' }),
  suggestion({ value: 'c', mention: '@c', username: 'charlie' }),
];

const mountPopover = (
  suggestions: ModSuggestion[] = three,
  activeIndex?: number
) =>
  mount(ModSuggestionsPopover, {
    props: { suggestions, style: {}, activeIndex },
  });

describe('ModSuggestionsPopover', () => {
  it('renders one button per suggestion', () => {
    expect(mountPopover().findAll('button')).toHaveLength(3);
  });

  it('shows the mention text for a suggestion', () => {
    expect(mountPopover().findAll('button')[0]!.text()).toContain('@a');
  });

  it('shows the username when present', () => {
    expect(mountPopover().findAll('button')[0]!.text()).toContain('@alpha');
  });

  it('omits the username span when absent', () => {
    const wrapper = mountPopover([suggestion({ mention: '@x', username: null })]);
    expect(wrapper.findAll('span')).toHaveLength(1);
  });

  it('emits select with the clicked suggestion', async () => {
    const wrapper = mountPopover();
    await wrapper.findAll('button')[1]!.trigger('click');
    expect(wrapper.emitted('select')![0]).toEqual([three[1]]);
  });

  it('highlights the active suggestion', () => {
    const wrapper = mountPopover(three, 1);
    expect(wrapper.findAll('button')[1]!.classes()).toContain('border-blue-400');
  });

  it('highlights the first suggestion by default when another is active', () => {
    const wrapper = mountPopover(three, 1);
    expect(wrapper.findAll('button')[0]!.classes()).toContain('bg-blue-50');
  });

  it('renders a non-active, non-first suggestion plainly', () => {
    const wrapper = mountPopover(three, 1);
    expect(wrapper.findAll('button')[2]!.classes()).toContain('bg-white');
  });
});

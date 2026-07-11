import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BotSuggestionsPopover from './BotSuggestionsPopover.vue';
import type { BotSuggestion } from '@/utils/botMentions';

const suggestion = (overrides: Partial<BotSuggestion> = {}): BotSuggestion => ({
  value: 'bot-1',
  label: 'Bot One',
  mention: '@bot-one',
  displayName: 'Bot One',
  ...overrides,
});

const three: BotSuggestion[] = [
  suggestion({ value: 'a', mention: '@a', displayName: 'Alpha' }),
  suggestion({ value: 'b', mention: '@b', displayName: 'Bravo' }),
  suggestion({ value: 'c', mention: '@c', displayName: 'Charlie' }),
];

const mountPopover = (
  suggestions: BotSuggestion[] = three,
  activeIndex?: number
) =>
  mount(BotSuggestionsPopover, {
    props: { suggestions, style: {}, activeIndex },
  });

describe('BotSuggestionsPopover', () => {
  it('renders one button per suggestion', () => {
    expect(mountPopover().findAll('button')).toHaveLength(3);
  });

  it('shows the mention text for a suggestion', () => {
    expect(mountPopover().findAll('button')[0]!.text()).toContain('@a');
  });

  it('shows the display name when present', () => {
    expect(mountPopover().findAll('button')[0]!.text()).toContain('Alpha');
  });

  it('omits the display name span when absent', () => {
    const wrapper = mountPopover([suggestion({ mention: '@x', displayName: null })]);
    expect(wrapper.findAll('span')).toHaveLength(1);
  });

  it('emits select with the clicked suggestion', async () => {
    const wrapper = mountPopover();
    await wrapper.findAll('button')[1]!.trigger('click');
    expect(wrapper.emitted('select')![0]).toEqual([three[1]]);
  });

  it('highlights the active suggestion', () => {
    const wrapper = mountPopover(three, 1);
    expect(wrapper.findAll('button')[1]!.classes()).toContain('border-orange-400');
  });

  it('highlights the first suggestion by default when another is active', () => {
    const wrapper = mountPopover(three, 1);
    expect(wrapper.findAll('button')[0]!.classes()).toContain('bg-orange-50');
  });

  it('renders a non-active, non-first suggestion plainly', () => {
    const wrapper = mountPopover(three, 1);
    expect(wrapper.findAll('button')[2]!.classes()).toContain('bg-white');
  });
});

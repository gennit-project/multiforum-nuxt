import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import LabelChangeHistory from '@/components/discussion/detail/activityFeed/LabelChangeHistory.vue';

const change = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  createdAt: '2024-01-01T00:00:00Z',
  actionType: 'added',
  labelDisplayName: 'Bug',
  labelValue: 'bug',
  ActorUser: { username: 'alice' },
  ...overrides,
});

const mountHistory = (labelChangeHistory: unknown[] = [change()]) =>
  mount(LabelChangeHistory, { props: { labelChangeHistory } });

const buttonByText = (w: ReturnType<typeof mount>, text: string) =>
  w.findAll('button').find((b) => b.text().includes(text));

describe('LabelChangeHistory visibility', () => {
  it('renders nothing without changes', () => {
    const wrapper = mountHistory([]);

    expect(wrapper.text()).toBe('');
  });

  it('renders the heading when there are changes', () => {
    const wrapper = mountHistory();

    expect(wrapper.text()).toContain('Label Change History');
  });
});

describe('LabelChangeHistory item', () => {
  it('shows the label name', () => {
    const wrapper = mountHistory();

    expect(wrapper.text()).toContain('Bug');
  });

  it('shows "added the" for an added label', () => {
    const wrapper = mountHistory();

    expect(wrapper.text()).toContain('added the');
  });

  it('shows "removed the" for a removed label', () => {
    const wrapper = mountHistory([change({ actionType: 'removed' })]);

    expect(wrapper.text()).toContain('removed the');
  });

  it.each([
    [{ ActorMod: { displayName: 'mod1' } }, 'mod1'],
    [{ ActorUser: { displayName: 'Alice A', username: 'alice' } }, 'Alice A'],
    [{ ActorUser: { username: 'alice' } }, 'alice'],
    [{ ActorMod: null, ActorUser: null }, '[Unknown]'],
  ])('resolves the actor name %#', (actor, expected) => {
    const wrapper = mountHistory([change({ ActorMod: null, ActorUser: null, ...actor })]);

    expect(wrapper.text()).toContain(expected);
  });
});

describe('LabelChangeHistory collapse', () => {
  const three = [
    change({ id: 'c1', labelDisplayName: 'First' }),
    change({ id: 'c2', labelDisplayName: 'Second' }),
    change({ id: 'c3', labelDisplayName: 'Third' }),
  ];

  it('shows only the most recent change by default', () => {
    const wrapper = mountHistory(three);

    expect(wrapper.text()).not.toContain('Second');
  });

  it('offers to show older changes (pluralized)', () => {
    const wrapper = mountHistory(three);

    expect(buttonByText(wrapper, 'Show 2 older changes')).toBeTruthy();
  });

  it('expands to show all changes', async () => {
    const wrapper = mountHistory(three);

    await buttonByText(wrapper, 'Show 2 older changes')!.trigger('click');

    expect(wrapper.text()).toContain('Second');
  });

  it('offers to hide older changes once expanded', async () => {
    const wrapper = mountHistory(three);

    await buttonByText(wrapper, 'Show 2 older changes')!.trigger('click');

    expect(buttonByText(wrapper, 'Hide older changes')).toBeTruthy();
  });

  it('uses the singular form for a single hidden change', () => {
    const wrapper = mountHistory([change({ id: 'c1' }), change({ id: 'c2' })]);

    expect(buttonByText(wrapper, 'Show 1 older change')).toBeTruthy();
  });
});

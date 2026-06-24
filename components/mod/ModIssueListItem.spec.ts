import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import ModIssueListItem from '@/components/mod/ModIssueListItem.vue';
import type { Issue } from '@/__generated__/graphql';

const issue = (overrides: Record<string, unknown> = {}) =>
  ({
    issueNumber: 7,
    title: 'A reported thing',
    isOpen: true,
    createdAt: '2024-01-01T00:00:00Z',
    Channel: { uniqueName: 'cats' },
    Author: { __typename: 'User', username: 'alice' },
    ActivityFeedAggregate: { count: 0 },
    ...overrides,
  }) as unknown as Issue;

const mountItem = (props: Record<string, unknown> = {}) =>
  mount(ModIssueListItem, {
    props: { issue: issue(), ...props },
    global: {
      stubs: {
        FlagIcon: true,
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        'nuxt-link': { props: ['to'], template: '<a><slot /></a>' },
      },
    },
  });

const selectButton = (w: ReturnType<typeof mount>) =>
  w.findAll('button').find((b) => b.text().includes('A reported thing'))!;

describe('ModIssueListItem content', () => {
  it('shows the issue title', () => {
    const wrapper = mountItem();

    expect(wrapper.text()).toContain('A reported thing');
  });

  it('shows the opened-by line with the author and channel', () => {
    const wrapper = mountItem();

    expect(wrapper.text()).toContain('by alice in cats');
  });

  it('uses the mod display name for a moderation-profile author', () => {
    const wrapper = mountItem({
      issue: issue({ Author: { __typename: 'ModerationProfile', displayName: 'mod1' } }),
    });

    expect(wrapper.text()).toContain('by mod1');
  });

  it('falls back to [Deleted] for an unknown author', () => {
    const wrapper = mountItem({ issue: issue({ Author: null }) });

    expect(wrapper.text()).toContain('by [Deleted]');
  });
});

describe('ModIssueListItem badges', () => {
  it('shows a Locked badge when locked', () => {
    const wrapper = mountItem({ issue: issue({ locked: true }) });

    expect(wrapper.text()).toContain('Locked');
  });

  it('shows a server-rule-violation badge', () => {
    const wrapper = mountItem({ issue: issue({ flaggedServerRuleViolation: true }) });

    expect(wrapper.text()).toContain('Server Rule Violation');
  });

  it('shows a singular report badge', () => {
    const wrapper = mountItem({ issue: issue({ ActivityFeedAggregate: { count: 1 } }) });

    expect(wrapper.text()).toContain('1 report');
  });

  it('shows a plural report badge', () => {
    const wrapper = mountItem({ issue: issue({ ActivityFeedAggregate: { count: 3 } }) });

    expect(wrapper.text()).toContain('3 reports');
  });

  it('hides the report badge when the count is zero', () => {
    const wrapper = mountItem({ issue: issue({ title: 'Plain title' }) });

    expect(wrapper.text()).not.toContain('report');
  });

  it('shows a Bot badge for bot-related issues', () => {
    const wrapper = mountItem({ issue: issue({ relatedUsername: 'bot-helper' }) });

    expect(wrapper.text()).toContain('Bot');
  });

  it('shows a Wiki Edit badge for wiki-related issues', () => {
    const wrapper = mountItem({ issue: issue({ relatedWikiPageId: 'w1' }) });

    expect(wrapper.text()).toContain('Wiki Edit');
  });
});

describe('ModIssueListItem selection', () => {
  it('emits select with the issue payload', async () => {
    const wrapper = mountItem();

    await selectButton(wrapper).trigger('click');

    expect(wrapper.emitted('select')?.[0]).toEqual([
      { issueNumber: 7, title: 'A reported thing', channelId: 'cats' },
    ]);
  });

  it('does not emit select without a channel', async () => {
    const wrapper = mountItem({ issue: issue({ Channel: null }) });

    // With no Channel the title renders as plain text, not a button.
    expect(wrapper.findAll('button')).toHaveLength(0);
  });

  it('highlights the selected issue', () => {
    const wrapper = mountItem({ selectedIssueNumber: 7 });

    expect(wrapper.html()).toContain('bg-gray-100');
  });
});

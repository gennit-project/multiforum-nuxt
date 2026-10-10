import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Issue } from '@/__generated__/graphql';
import IssueDetailHeader from './IssueDetailHeader.vue';
import GenericButton from '@/components/GenericButton.vue';

const buildIssue = (overrides: Partial<Issue> = {}): Issue =>
  ({
    id: 'issue-1',
    issueNumber: 42,
    title: 'Reported comment needs review',
    isOpen: true,
    locked: false,
    createdAt: '2026-10-10T12:00:00.000Z',
    Author: { __typename: 'User', username: 'alice' },
    ...overrides,
  }) as Issue;

const mountHeader = (overrides: Partial<Issue> = {}) =>
  mount(IssueDetailHeader, {
    props: {
      issue: buildIssue(overrides),
      contextChannels: ['cats'],
      showActions: true,
    },
    global: {
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  });

describe('IssueDetailHeader', () => {
  it('renders the issue title as the page heading', () => {
    const wrapper = mountHeader();
    expect(wrapper.get('h1').text()).toBe('Reported comment needs review');
  });

  it('shows the issue number and open state', () => {
    const wrapper = mountHeader();
    expect({
      state: wrapper.get('[aria-live="polite"]').text(),
      number: wrapper.text().includes('#42'),
    }).toEqual({ state: 'Open', number: true });
  });

  it('links each context channel to its forum', () => {
    const wrapper = mountHeader();
    expect(wrapper.get('nav a').attributes('href')).toBe('/forums/cats');
  });

  it('hides the reply action while the issue is locked', () => {
    const wrapper = mountHeader({ locked: true });
    expect(wrapper.find('a[href="#issue-comment-composer"]').exists()).toBe(
      false
    );
  });

  it('supports an action-only header when the route already renders the title', () => {
    const wrapper = mount(IssueDetailHeader, {
      props: { issue: buildIssue(), showActions: true, showSummary: false },
    });
    expect(wrapper.find('h1').exists()).toBe(false);
  });

  it('emits the close or reopen action from the header', async () => {
    const wrapper = mountHeader();
    const closeButton = wrapper
      .findAllComponents(GenericButton)
      .find((button) => button.props('text') === 'Close issue');
    await closeButton?.trigger('click');
    expect(wrapper.emitted('toggleCloseOpen')).toHaveLength(1);
  });
});

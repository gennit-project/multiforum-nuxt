import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ChannelHealthTableRow from '@/components/admin/ChannelHealthTableRow.vue';

const baseRow = {
  id: 'channel-1',
  channelUniqueName: 'support',
  displayName: 'Support Forum',
  channelIconURL: null,
  discussionCount: 4,
  commentCount: 18,
  eventCount: 3,
  voteCount: 10,
  uniqueContributorCount: 4,
  openIssueCount: 0,
  oldestOpenIssueAgeDays: null,
  healthLabel: 'Active',
};

const mountRow = (row = {}, props: Record<string, unknown> = {}) =>
  mount(ChannelHealthTableRow, {
    props: {
      row: { ...baseRow, ...row },
      ...props,
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

const cellTexts = (wrapper: ReturnType<typeof mountRow>) =>
  wrapper.findAll('td').map((cell) => cell.text());

describe('ChannelHealthTableRow', () => {
  it('renders channel identity and links to the forum', () => {
    const wrapper = mountRow();

    expect({
      text: wrapper.text(),
      href: wrapper.get('a').attributes('href'),
    }).toEqual({
      text: expect.stringContaining('Support Forum'),
      href: '/forums/support',
    });
  });

  it('lists discussions, comments, events, votes and contributors as separate cells', () => {
    expect(cellTexts(mountRow()).slice(1, 6)).toEqual([
      '4',
      '18',
      '3',
      '10',
      '4',
    ]);
  });

  it('does not render the removed new-issues or pressure columns', () => {
    expect(mountRow().findAll('td')).toHaveLength(9);
  });

  it('uses initials when a channel has no icon URL', () => {
    const wrapper = mountRow({ displayName: null, channelUniqueName: 'qa' });

    expect(wrapper.text()).toContain('QA');
  });

  it('uses the channel icon when an icon URL is present', () => {
    const wrapper = mountRow({ channelIconURL: 'https://example.test/icon.png' });

    expect(wrapper.get('img').attributes('src')).toBe(
      'https://example.test/icon.png'
    );
  });

  it('describes stale open issue age with singular wording', () => {
    const wrapper = mountRow({
      openIssueCount: 1,
      oldestOpenIssueAgeDays: 1,
      healthLabel: 'Needs review',
    });

    expect(wrapper.get('td[title*="oldest is 1 day old"]').text()).toBe('1d');
  });

  it('describes open issues without a known oldest age', () => {
    const wrapper = mountRow({
      openIssueCount: 2,
      oldestOpenIssueAgeDays: null,
    });

    expect(wrapper.get('td[title="2 open admin/server-scoped issues."]').text()).toBe(
      'Open'
    );
  });

  it('colours issues older than 30 days as urgent', () => {
    const wrapper = mountRow({ openIssueCount: 1, oldestOpenIssueAgeDays: 286 });

    expect(wrapper.get('td[title*="286 days"] span').classes()).toContain(
      'bg-red-100'
    );
  });

  it('shows a dash with a screen-reader label when no issues are open', () => {
    const wrapper = mountRow();

    expect(wrapper.get('td[title^="No open"]').text()).toBe('—No open issues');
  });

  it('explains healthy and quiet status labels', () => {
    const healthy = mountRow({ healthLabel: 'Healthy activity' });
    const quiet = mountRow({ healthLabel: 'Quiet' });

    expect({
      healthy: healthy.get('span[title^="Healthy activity"]').text(),
      quiet: quiet.get('span[title^="Quiet means"]').text(),
    }).toEqual({
      healthy: 'Healthy activity',
      quiet: 'Quiet',
    });
  });

  it('links to the channel detail view when a detail route base is given', () => {
    const wrapper = mountRow({}, { detailRouteBase: '/admin/dashboard' });

    expect(
      wrapper.findAll('a').map((link) => link.attributes('href'))
    ).toEqual(['/forums/support', '/admin/dashboard/support']);
  });
});

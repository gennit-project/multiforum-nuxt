import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ChannelHealthTableRow from '@/components/admin/ChannelHealthTableRow.vue';

const baseRow = {
  id: 'channel-1',
  channelUniqueName: 'support',
  displayName: 'Support Forum',
  channelIconURL: null,
  voteCount: 10,
  uniqueContributorCount: 4,
  openIssueCount: 0,
  issueOpenedCount: 1,
  oldestOpenIssueAgeDays: null,
  issuesPerHundredContributions: 0,
  activityScore: 25,
  healthLabel: 'Active',
};

const mountRow = (row = {}) =>
  mount(ChannelHealthTableRow, {
    props: {
      row: { ...baseRow, ...row },
      maxActivity: 100,
      maxIssuePressure: 40,
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

describe('ChannelHealthTableRow', () => {
  it('renders channel identity, link, and activity width', () => {
    const wrapper = mountRow();

    expect({
      text: wrapper.text(),
      href: wrapper.get('a').attributes('href'),
      activityWidth: wrapper.findAll('[style]')[0].attributes('style'),
    }).toEqual({
      text: expect.stringContaining('Support Forum'),
      href: '/forums/support',
      activityWidth: 'width: 25%;',
    });
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

  it('formats issue pressure with minimum nonzero bar width and high-load color', () => {
    const wrapper = mountRow({
      issuesPerHundredContributions: 20,
      healthLabel: 'High moderation load',
    });

    expect({
      pressureText: wrapper.get('td[title*="20.0 new"]').text(),
      pressureWidth: wrapper.findAll('[style]')[1].attributes('style'),
      highLoadBar: wrapper.find('.bg-yellow-500').exists(),
    }).toEqual({
      pressureText: '20.0',
      pressureWidth: 'width: 50%;',
      highLoadBar: true,
    });
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
});

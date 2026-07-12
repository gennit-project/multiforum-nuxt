import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ChannelHealthTable from '@/components/admin/ChannelHealthTable.vue';

const rows = [
  {
    id: 'c1',
    channelUniqueName: 'support',
    displayName: 'Support',
    voteCount: 3,
    uniqueContributorCount: 2,
    openIssueCount: 1,
    issueOpenedCount: 1,
    oldestOpenIssueAgeDays: 3,
    issuesPerHundredContributions: 10,
    activityScore: 8,
    healthLabel: 'Active',
  },
  {
    id: 'c2',
    channelUniqueName: 'help',
    displayName: 'Help',
    voteCount: 5,
    uniqueContributorCount: 4,
    openIssueCount: 2,
    issueOpenedCount: 2,
    oldestOpenIssueAgeDays: 8,
    issuesPerHundredContributions: 15,
    activityScore: 20,
    healthLabel: 'Needs review',
  },
];

const mountTable = (props: Record<string, unknown> = {}) =>
  mount(ChannelHealthTable, {
    props: {
      rows,
      loading: false,
      activeSortBy: 'activityScore',
      activeSortDirection: 'desc',
      ...props,
    },
    global: {
      stubs: {
        ChannelHealthTableRow: {
          name: 'ChannelHealthTableRow',
          props: ['row', 'maxActivity', 'maxIssuePressure'],
          template: '<tr class="row-stub"><td>{{ row.channelUniqueName }}</td></tr>',
        },
      },
    },
  });

describe('ChannelHealthTable', () => {
  it('emits sort when a column header is clicked', async () => {
    const wrapper = mountTable();
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('sort')?.[0]).toEqual(['channelUniqueName']);
  });

  it('marks the active column with descending aria-sort', () => {
    const wrapper = mountTable();
    const headers = wrapper.findAll('th');
    expect({
      first: headers[0]?.attributes('aria-sort'),
      second: headers[1]?.attributes('aria-sort'),
    }).toEqual({
      first: 'none',
      second: 'descending',
    });
  });

  it('marks every column header with scope="col"', () => {
    const wrapper = mountTable();
    expect(
      wrapper.findAll('th').every((th) => th.attributes('scope') === 'col')
    ).toBe(true);
  });

  it('renders five loading skeleton rows while loading', () => {
    const wrapper = mountTable({ rows: [], loading: true });
    expect(wrapper.findAll('[data-testid="channel-health-loading-row"]')).toHaveLength(5);
  });

  it('shows the empty state when there are no rows', () => {
    const wrapper = mountTable({ rows: [] });
    expect(wrapper.text()).toContain('No channel activity in this range.');
  });

  it('passes the computed max activity and issue pressure to each row', () => {
    const wrapper = mountTable();
    const rowComponents = wrapper.findAllComponents({ name: 'ChannelHealthTableRow' });
    expect({
      maxActivity: rowComponents[0]?.props('maxActivity'),
      maxIssuePressure: rowComponents[0]?.props('maxIssuePressure'),
      rowCount: rowComponents.length,
    }).toEqual({
      maxActivity: 20,
      maxIssuePressure: 15,
      rowCount: 2,
    });
  });
});

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ChannelHealthTable from '@/components/admin/ChannelHealthTable.vue';

const makeRow = (
  name: string,
  healthLabel: string,
  overrides: Record<string, unknown> = {}
) => ({
  id: name,
  channelUniqueName: name,
  displayName: name,
  discussionCount: 1,
  commentCount: 2,
  eventCount: 0,
  voteCount: 3,
  uniqueContributorCount: 2,
  openIssueCount: 0,
  oldestOpenIssueAgeDays: null,
  healthLabel,
  ...overrides,
});

const rows = [
  makeRow('busy', 'Healthy activity'),
  makeRow('stale', 'Needs review', { openIssueCount: 1 }),
  makeRow('steady', 'Active'),
  makeRow('loaded', 'High moderation load'),
  makeRow('asleep', 'Quiet'),
  makeRow('dormant', 'Quiet'),
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
          props: ['row', 'detailRouteBase'],
          template:
            '<tr data-testid="row-stub"><td>{{ row.channelUniqueName }}</td></tr>',
        },
      },
    },
  });

const renderedChannels = (wrapper: ReturnType<typeof mountTable>) =>
  wrapper.findAll('[data-testid="row-stub"]').map((row) => row.text());

const chipText = (wrapper: ReturnType<typeof mountTable>, key: string) =>
  wrapper.get(`[data-testid="channel-filter-${key}"]`).text();

describe('ChannelHealthTable', () => {
  it('emits sort when a column header is clicked', async () => {
    const wrapper = mountTable();
    await wrapper.get('th button').trigger('click');
    expect(wrapper.emitted('sort')?.[0]).toEqual(['channelUniqueName']);
  });

  it('lists discussions, comments, events and votes as separate sortable columns', () => {
    const wrapper = mountTable();

    expect(wrapper.findAll('th').map((header) => header.text())).toEqual([
      'Channel',
      'Discussions',
      'Comments',
      'Events',
      'Votes',
      'Contributors',
      'Open issues',
      'Oldest open',
      'Status',
    ]);
  });

  it('emits the matching sort key for the comments column', async () => {
    const wrapper = mountTable();
    const commentsButton = wrapper
      .findAll('th button')
      .find((button) => button.text() === 'Comments');
    await commentsButton?.trigger('click');
    expect(wrapper.emitted('sort')?.[0]).toEqual(['commentCount']);
  });

  it('marks the active column with descending aria-sort', () => {
    const wrapper = mountTable({ activeSortBy: 'commentCount' });
    const headers = wrapper.findAll('th');
    expect({
      channel: headers[0]?.attributes('aria-sort'),
      comments: headers[2]?.attributes('aria-sort'),
    }).toEqual({
      channel: 'none',
      comments: 'descending',
    });
  });

  it('marks every column header with scope="col"', () => {
    const wrapper = mountTable();
    expect(
      wrapper.findAll('th').every((th) => th.attributes('scope') === 'col')
    ).toBe(true);
  });

  it('adds a details column header when a detail route base is set', () => {
    const wrapper = mountTable({ detailRouteBase: '/admin/dashboard' });
    expect(wrapper.findAll('th')).toHaveLength(10);
  });

  it('renders five loading skeleton rows while loading', () => {
    const wrapper = mountTable({ rows: [], loading: true });
    expect(wrapper.findAll('[data-testid="channel-health-loading-row"]')).toHaveLength(5);
  });

  it('shows the empty state when there are no rows', () => {
    const wrapper = mountTable({ rows: [] });
    expect(wrapper.text()).toContain('No channel activity in this range.');
  });

  it('hides quiet channels by default and offers to show them', () => {
    const wrapper = mountTable();

    expect({
      channels: renderedChannels(wrapper),
      prompt: wrapper
        .get('[data-testid="quiet-channels-prompt"]')
        .text()
        .replace(/\s+/g, ' '),
    }).toEqual({
      channels: ['stale', 'loaded', 'busy', 'steady'],
      prompt:
        '2 more channels had no activity in this range. Show quiet channels',
    });
  });

  it('floats channels needing review above busier ones in the default order', () => {
    expect(renderedChannels(mountTable()).slice(0, 2)).toEqual([
      'stale',
      'loaded',
    ]);
  });

  it('keeps the order the admin chose once a column is sorted', () => {
    const wrapper = mountTable({
      activeSortBy: 'channelUniqueName',
      activeSortDirection: 'asc',
    });

    expect(renderedChannels(wrapper)).toEqual([
      'busy',
      'stale',
      'steady',
      'loaded',
    ]);
  });

  it('counts channels in each filter chip', () => {
    const wrapper = mountTable();

    expect({
      all: chipText(wrapper, 'all'),
      review: chipText(wrapper, 'review'),
      active: chipText(wrapper, 'active'),
      quiet: chipText(wrapper, 'quiet'),
    }).toEqual({
      all: 'All 6',
      review: 'Needs review 2',
      active: 'Active 2',
      quiet: 'Quiet 2',
    });
  });

  it('shows only channels that need review when that chip is pressed', async () => {
    const wrapper = mountTable();
    await wrapper.get('[data-testid="channel-filter-review"]').trigger('click');

    expect(renderedChannels(wrapper)).toEqual(['stale', 'loaded']);
  });

  it('shows quiet channels from the chip and hides the prompt', async () => {
    const wrapper = mountTable();
    await wrapper.get('[data-testid="channel-filter-quiet"]').trigger('click');

    expect({
      channels: renderedChannels(wrapper),
      prompt: wrapper.find('[data-testid="quiet-channels-prompt"]').exists(),
    }).toEqual({ channels: ['asleep', 'dormant'], prompt: false });
  });

  it('shows quiet channels from the prompt button', async () => {
    const wrapper = mountTable();
    await wrapper
      .get('[data-testid="quiet-channels-prompt"] button')
      .trigger('click');

    expect(renderedChannels(wrapper)).toEqual(['asleep', 'dormant']);
  });

  it('marks the selected filter chip as pressed', async () => {
    const wrapper = mountTable();
    await wrapper.get('[data-testid="channel-filter-active"]').trigger('click');

    expect(
      wrapper.get('[data-testid="channel-filter-active"]').attributes('aria-pressed')
    ).toBe('true');
  });

  it('explains the default ordering in the subtitle', () => {
    expect(
      mountTable().get('[data-testid="channel-health-subtitle"]').text()
    ).toBe(
      'Channels needing review first, then by total contributions. Issue counts are admin-scoped only.'
    );
  });

  it('names the sorted column in the subtitle once the admin sorts', () => {
    const wrapper = mountTable({
      activeSortBy: 'commentCount',
      activeSortDirection: 'asc',
    });

    expect(
      wrapper.get('[data-testid="channel-health-subtitle"]').text()
    ).toBe('Sorted by comments, ascending. Issue counts are admin-scoped only.');
  });
});

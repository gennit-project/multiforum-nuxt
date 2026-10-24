import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ServerDashboardActivityChart from '@/components/admin/ServerDashboardActivityChart.vue';

const mountChart = (
  timeSeries: Array<Record<string, unknown>>,
  range: { startDate?: string; endDate?: string } = {}
) =>
  mount(ServerDashboardActivityChart, {
    props: { timeSeries, ...range },
  });

const bars = (wrapper: ReturnType<typeof mountChart>) =>
  wrapper.findAll('[data-testid="activity-bar"]');

// Segment colours also appear on the legend swatches, so scope to the bars.
const segmentStyles = (
  wrapper: ReturnType<typeof mountChart>,
  barIndex: number,
  colorClass: string
) => bars(wrapper)[barIndex]?.get(`.${colorClass}`).attributes('style');

describe('ServerDashboardActivityChart', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('describes each bar with its date and a breakdown by type', () => {
    const wrapper = mountChart([
      { date: '2024-01-10', discussions: 1, comments: 2, events: 3 },
    ]);

    expect(bars(wrapper)[0]?.attributes('title')).toBe(
      'Jan 10: 1 discussion, 2 comments, 3 events'
    );
  });

  it('shows the formatted date under the plot', () => {
    const wrapper = mountChart([
      { date: '2024-01-10', discussions: 1, comments: 2, events: 3 },
    ]);

    expect(wrapper.text()).toContain('Jan 10');
  });

  it('totals each series for the legend', () => {
    const wrapper = mountChart([
      { date: '2024-01-10', discussions: 2, comments: 1, events: 0 },
      { date: '2024-01-11', discussions: 3, comments: 4, events: 5 },
    ]);

    expect({
      discussions: wrapper.get('[data-testid="total-discussions"]').text(),
      comments: wrapper.get('[data-testid="total-comments"]').text(),
      events: wrapper.get('[data-testid="total-events"]').text(),
    }).toEqual({ discussions: '5', comments: '5', events: '5' });
  });

  it('scales the busiest day to the full height of the plot', () => {
    const wrapper = mountChart([
      { date: '2024-01-10', discussions: 2, comments: 1, events: 1 },
      { date: '2024-01-11', discussions: 1, comments: 1, events: 0 },
    ]);

    expect({
      firstDiscussions: segmentStyles(wrapper, 0, 'bg-blue-500'),
      secondDiscussions: segmentStyles(wrapper, 1, 'bg-blue-500'),
      firstComments: segmentStyles(wrapper, 0, 'bg-brand-500'),
      firstEvents: segmentStyles(wrapper, 0, 'bg-green-500'),
    }).toEqual({
      firstDiscussions: 'height: 50%;',
      secondDiscussions: 'height: 25%;',
      firstComments: 'height: 25%;',
      firstEvents: 'height: 25%;',
    });
  });

  it('labels the y axis with zero, the midpoint and the busiest day', () => {
    const wrapper = mountChart([
      { date: '2024-01-10', discussions: 6, comments: 4, events: 0 },
    ]);

    expect(
      wrapper
        .get('[aria-hidden="true"]')
        .findAll('span')
        .map((label) => label.text())
    ).toEqual(['10', '5', '0']);
  });

  it('drops the midpoint label when the busiest day is a single contribution', () => {
    const wrapper = mountChart([
      { date: '2024-01-10', discussions: 1, comments: 0, events: 0 },
    ]);

    expect(
      wrapper
        .get('[aria-hidden="true"]')
        .findAll('span')
        .map((label) => label.text())
    ).toEqual(['1', '0']);
  });

  it('renders one bar per day across the selected range even when the series is sparse', () => {
    const wrapper = mountChart(
      [{ date: '2024-01-12', discussions: 1, comments: 0, events: 0 }],
      { startDate: '2024-01-10', endDate: '2024-01-14' }
    );

    expect(bars(wrapper)).toHaveLength(5);
  });

  it('zero-fills days in the range that the series does not cover', () => {
    const wrapper = mountChart(
      [{ date: '2024-01-12', discussions: 1, comments: 0, events: 0 }],
      { startDate: '2024-01-10', endDate: '2024-01-14' }
    );

    expect(bars(wrapper)[0]?.attributes('title')).toBe(
      'Jan 10: 0 discussions, 0 comments, 0 events'
    );
  });

  it('drops series points that fall outside the selected range', () => {
    const wrapper = mountChart(
      [
        { date: '2024-01-12', discussions: 1, comments: 0, events: 0 },
        { date: '2024-01-20', discussions: 9, comments: 9, events: 9 },
      ],
      { startDate: '2024-01-10', endDate: '2024-01-14' }
    );

    expect(wrapper.text()).not.toContain('Jan 20');
  });

  it('falls back to the raw series when the range is invalid', () => {
    const wrapper = mountChart(
      [
        { date: '2024-01-12', discussions: 1, comments: 0, events: 0 },
        { date: '2024-01-13', discussions: 1, comments: 0, events: 0 },
      ],
      { startDate: 'not-a-date', endDate: '2024-01-14' }
    );

    expect(bars(wrapper)).toHaveLength(2);
  });

  it('samples five date labels instead of one per day on a long range', () => {
    const wrapper = mountChart([], {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });

    expect(
      wrapper
        .get('[aria-hidden="true"] ~ div > div:last-child')
        .findAll('span')
        .map((label) => label.text())
    ).toEqual(['Jan 1', 'Jan 9', 'Jan 16', 'Jan 24', 'Jan 31']);
  });

  it('never needs horizontal scrolling for a long range', () => {
    const wrapper = mountChart([], {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });

    expect(wrapper.find('.overflow-x-auto').exists()).toBe(false);
  });

  it('summarises the chart for assistive technology', () => {
    const wrapper = mountChart(
      [{ date: '2024-01-12', discussions: 3, comments: 2, events: 0 }],
      { startDate: '2024-01-10', endDate: '2024-01-14' }
    );

    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe(
      'Bar chart of daily contributions from Jan 10 to Jan 14. Busiest day was Jan 12 with 5.'
    );
  });

  it('keeps zero-height segments and the legend labels when there is no activity', () => {
    const wrapper = mountChart([
      { date: '2024-01-12', discussions: 0, comments: 0, events: 0 },
    ]);

    expect({
      discussions: segmentStyles(wrapper, 0, 'bg-blue-500'),
      comments: segmentStyles(wrapper, 0, 'bg-brand-500'),
      events: segmentStyles(wrapper, 0, 'bg-green-500'),
      legend:
        wrapper.text().includes('Discussions') &&
        wrapper.text().includes('Comments') &&
        wrapper.text().includes('Events'),
    }).toEqual({
      discussions: 'height: 0%;',
      comments: 'height: 0%;',
      events: 'height: 0%;',
      legend: true,
    });
  });
});

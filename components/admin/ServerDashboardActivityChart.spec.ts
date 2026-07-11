import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ServerDashboardActivityChart from '@/components/admin/ServerDashboardActivityChart.vue';

const mountChart = (
  timeSeries: Array<Record<string, unknown>>,
  range: { startDate?: string; endDate?: string } = {}
) =>
  mount(ServerDashboardActivityChart, {
    props: { timeSeries, ...range },
    global: {
      stubs: {
        CalendarDays: { template: '<svg class="calendar" />' },
      },
    },
  });

// Each rendered day-bar column is the `.min-w-6` wrapper (distinct from the
// legend's coloured dots, which also use the segment colour classes).
const barCount = (wrapper: ReturnType<typeof mountChart>) =>
  wrapper.findAll('.min-w-6').length;

describe('ServerDashboardActivityChart', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders formatted date labels and total activity in each bar title', () => {
    const wrapper = mountChart([
      { date: '2024-01-10', discussions: 1, comments: 2, events: 3 },
    ]);

    expect(wrapper.text()).toContain('Jan 10');
    expect(wrapper.get('[title="Jan 10: 6"]').exists()).toBe(true);
  });

  it('scales stacked segment heights against the busiest day', () => {
    const wrapper = mountChart([
      { date: '2024-01-10', discussions: 2, comments: 1, events: 1 },
      { date: '2024-01-11', discussions: 1, comments: 1, events: 0 },
    ]);

    const blue = wrapper.findAll('.bg-blue-500');
    const orange = wrapper.findAll('.bg-orange-500');
    const green = wrapper.findAll('.bg-green-500');

    expect({
      firstBlue: blue[0]?.attributes('style'),
      secondBlue: blue[1]?.attributes('style'),
      firstOrange: orange[0]?.attributes('style'),
      firstGreen: green[0]?.attributes('style'),
    }).toEqual({
      firstBlue: 'height: 50%;',
      secondBlue: 'height: 25%;',
      firstOrange: 'height: 25%;',
      firstGreen: 'height: 25%;',
    });
  });

  it('renders one bar per day across the selected range even when the series is sparse', () => {
    const wrapper = mountChart(
      [{ date: '2024-01-12', discussions: 1, comments: 0, events: 0 }],
      { startDate: '2024-01-10', endDate: '2024-01-14' }
    );

    expect(barCount(wrapper)).toBe(5);
  });

  it('zero-fills days in the range that the series does not cover', () => {
    const wrapper = mountChart(
      [{ date: '2024-01-12', discussions: 1, comments: 0, events: 0 }],
      { startDate: '2024-01-10', endDate: '2024-01-14' }
    );

    expect(wrapper.get('[title="Jan 10: 0"]').exists()).toBe(true);
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

    expect(barCount(wrapper)).toBe(2);
  });

  it('renders zero-height segments and keeps the legend labels', () => {
    const wrapper = mountChart([
      { date: '', discussions: 0, comments: 0, events: 0 },
    ]);

    expect({
      emptyTitle: wrapper.get('[title=": 0"]').exists(),
      blue: wrapper.find('.bg-blue-500').attributes('style'),
      orange: wrapper.find('.bg-orange-500').attributes('style'),
      green: wrapper.find('.bg-green-500').attributes('style'),
      legend: wrapper.text().includes('Discussions') && wrapper.text().includes('Comments') && wrapper.text().includes('Events'),
    }).toEqual({
      emptyTitle: true,
      blue: 'height: 0%;',
      orange: 'height: 0%;',
      green: 'height: 0%;',
      legend: true,
    });
  });
});

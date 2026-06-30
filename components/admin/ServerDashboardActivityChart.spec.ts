import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ServerDashboardActivityChart from '@/components/admin/ServerDashboardActivityChart.vue';

const mountChart = (timeSeries: Array<Record<string, unknown>>) =>
  mount(ServerDashboardActivityChart, {
    props: { timeSeries },
    global: {
      stubs: {
        CalendarDays: { template: '<svg class="calendar" />' },
      },
    },
  });

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

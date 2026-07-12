import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import ContributionLineChart from '@/components/charts/ContributionLineChart.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

// Stub the canvas-rendering chart so the test exercises only the accessible
// text alternatives, not chart.js/canvas (unavailable in happy-dom).
const LineStub = defineComponent({
  name: 'Line',
  props: ['data', 'options'],
  template: '<canvas class="line-stub" />',
});

// One day with 2 comments + 1 discussion, another with 1 comment + 0
// discussions → totals of 3 comments and 1 discussion.
const dayData = [
  {
    date: '2024-01-02',
    activities: [{ Comments: [{}, {}], Discussions: [{}] }],
  },
  { date: '2024-01-01', activities: [{ Comments: [{}], Discussions: [] }] },
];

const mountChart = () =>
  mountWithDefaults(ContributionLineChart, {
    props: { dayData },
    global: { stubs: { Line: LineStub } },
  });

describe('ContributionLineChart', () => {
  it('exposes the chart as an image with a data summary label', () => {
    const wrapper = mountChart();

    expect(wrapper.get('[role="img"]').attributes('aria-label')).toContain(
      '3 comments and 1 discussions'
    );
  });

  it('renders a visually-hidden data-table alternative', () => {
    const wrapper = mountChart();

    expect(wrapper.get('table').classes()).toContain('sr-only');
  });

  it('lists one table row per day of data', () => {
    const wrapper = mountChart();

    expect(wrapper.findAll('tbody tr').length).toBe(2);
  });
});

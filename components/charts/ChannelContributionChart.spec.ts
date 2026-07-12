import { describe, expect, it, vi, beforeEach } from 'vitest';
import { defineComponent } from 'vue';

import ChannelContributionChart from '@/components/charts/ChannelContributionChart.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const h = vi.hoisted(() => ({
  theme: 'light',
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({ theme: h.theme }),
}));

const chartStub = defineComponent({
  name: 'ContributionLineChart',
  props: ['dayData', 'darkMode', 'maxYValue'],
  template: '<div class="chart-stub" />',
});

const clientOnlyStub = defineComponent({
  name: 'ClientOnly',
  template: '<div class="client-only-stub"><slot /></div>',
});

const mountChart = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(ChannelContributionChart, {
    props: {
      dayData: [{ date: '2024-01-01', value: 5 }],
      maxYValue: 10,
      ...props,
    },
    global: {
      stubs: {
        ContributionLineChart: chartStub,
        ClientOnly: clientOnlyStub,
      },
    },
  });

beforeEach(() => {
  h.theme = 'light';
});

describe('ChannelContributionChart', () => {
  it('passes the day data through to the line chart', () => {
    const dayData = [{ date: '2024-01-01', value: 5 }];
    const wrapper = mountChart({ dayData });

    expect(wrapper.getComponent(chartStub).props('dayData')).toEqual(dayData);
  });

  it('passes maxYValue through to the line chart', () => {
    const wrapper = mountChart({ maxYValue: 42 });

    expect(wrapper.getComponent(chartStub).props('maxYValue')).toBe(42);
  });

  it('passes darkMode=false when the UI theme is light', () => {
    const wrapper = mountChart();

    expect(wrapper.getComponent(chartStub).props('darkMode')).toBe(false);
  });

  it('passes darkMode=true when the UI theme is dark', () => {
    h.theme = 'dark';
    const wrapper = mountChart();

    expect(wrapper.getComponent(chartStub).props('darkMode')).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ServerDashboardIssueAging from '@/components/admin/ServerDashboardIssueAging.vue';

const mountAging = (issueAging: Array<Record<string, unknown>>) =>
  mount(ServerDashboardIssueAging, {
    props: { issueAging },
    global: {
      stubs: {
        Clock3: { template: '<svg class="clock" />' },
      },
    },
  });

describe('ServerDashboardIssueAging', () => {
  it('renders each bucket label and count', () => {
    const wrapper = mountAging([
      { label: '0-3d', minDays: 0, maxDays: 3, count: 2 },
      { label: '4-7d', minDays: 4, maxDays: 7, count: 5 },
    ]);

    expect(wrapper.text()).toContain('0-3d');
    expect(wrapper.text()).toContain('4-7d');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('5');
  });

  it('scales bar widths relative to the largest bucket', () => {
    const wrapper = mountAging([
      { label: '0-3d', minDays: 0, maxDays: 3, count: 2 },
      { label: '4-7d', minDays: 4, maxDays: 7, count: 5 },
    ]);

    const bars = wrapper.findAll('.bg-yellow-500');
    expect({
      first: bars[0]?.attributes('style'),
      second: bars[1]?.attributes('style'),
    }).toEqual({
      first: 'width: 40%;',
      second: 'width: 100%;',
    });
  });

  it('keeps a minimum visible width for nonzero counts and zero width for empty buckets', () => {
    const wrapper = mountAging([
      { label: '0-3d', minDays: 0, maxDays: 3, count: 0 },
      { label: '30d+', minDays: 30, maxDays: null, count: 1 },
    ]);

    const bars = wrapper.findAll('.bg-yellow-500');
    expect({
      zero: bars[0]?.attributes('style'),
      minimum: bars[1]?.attributes('style'),
    }).toEqual({
      zero: 'width: 0%;',
      minimum: 'width: 100%;',
    });
  });
});

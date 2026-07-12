import { describe, expect, it } from 'vitest';

import ContributionChartSkeleton from '@/components/charts/ContributionChartSkeleton.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const mountSkeleton = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(ContributionChartSkeleton, {
    props,
  });

describe('ContributionChartSkeleton', () => {
  it('renders twelve month placeholders', () => {
    const wrapper = mountSkeleton();

    expect(wrapper.findAll('[key^="skeleton-month-"]')).toHaveLength(0);
    expect(wrapper.findAll('.absolute.h-3.w-8.rounded.text-xs')).toHaveLength(12);
  });

  it('renders seven day label placeholders', () => {
    const wrapper = mountSkeleton();

    expect(wrapper.findAll('.text-tiny .absolute.flex.items-center')).toHaveLength(7);
  });

  it('renders the full 52 by 7 cell grid', () => {
    const wrapper = mountSkeleton();

    expect(wrapper.findAll('.h-\\[10px\\].w-\\[10px\\].rounded-sm')).toHaveLength(364);
  });

  it('uses the light placeholder color by default', () => {
    const wrapper = mountSkeleton();

    expect(wrapper.html()).toContain('bg-gray-300');
  });

  it('uses the dark placeholder color in dark mode', () => {
    const wrapper = mountSkeleton({ darkMode: true });

    expect(wrapper.html()).toContain('bg-gray-700');
  });

  it('renders five legend level swatches', () => {
    const wrapper = mountSkeleton();

    expect(wrapper.findAll('.mt-4 .h-3.w-3.rounded-sm')).toHaveLength(5);
  });
});

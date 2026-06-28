import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DownloadSkeletonCard from './DownloadSkeletonCard.vue';

describe('DownloadSkeletonCard', () => {
  it('renders a list-item placeholder', () => {
    const wrapper = mount(DownloadSkeletonCard);
    expect(wrapper.find('li').exists()).toBe(true);
  });

  it('renders animated skeleton placeholders for the card sections', () => {
    const wrapper = mount(DownloadSkeletonCard);
    // image, title, two author lines, two tags, vote + comment placeholders
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThanOrEqual(7);
  });
});

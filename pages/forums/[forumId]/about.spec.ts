import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import ForumAboutPage from './about.vue';
import ChannelAboutPage from '@/components/channel/ChannelAboutPage.vue';

describe('forum about page', () => {
  it('renders the channel about page', () => {
    const wrapper = shallowMount(ForumAboutPage);
    expect(wrapper.findComponent(ChannelAboutPage).exists()).toBe(true);
  });
});

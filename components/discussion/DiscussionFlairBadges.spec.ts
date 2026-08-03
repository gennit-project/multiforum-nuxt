import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import DiscussionFlairBadges from './DiscussionFlairBadges.vue';

const flairs = [
  {
    id: 'help',
    channelUniqueName: 'cats',
    displayName: 'Help',
    color: '#112233',
    order: 1,
    archived: true,
  },
  {
    id: 'question',
    channelUniqueName: 'cats',
    displayName: 'Question',
    color: null,
    order: 0,
    archived: false,
  },
];

describe('DiscussionFlairBadges', () => {
  it('renders flairs in configured order', () => {
    const wrapper = mount(DiscussionFlairBadges, { props: { flairs } });
    expect(
      wrapper.findAll('[data-testid="discussion-flair"]').map((item) => item.text())
    ).toEqual(['Question', 'Help']);
  });

  it('keeps archived historical flairs visible and marks them', () => {
    const wrapper = mount(DiscussionFlairBadges, { props: { flairs } });
    expect(wrapper.get('[title="Archived flair"]').text()).toBe('Help');
  });

  it('can identify the owning forum in sitewide contexts', () => {
    const wrapper = mount(DiscussionFlairBadges, {
      props: { flairs, channelName: 'cats', showChannelName: true },
    });
    expect(wrapper.text()).toContain('cats: Question');
    expect(wrapper.get('ul').attributes('aria-label')).toBe(
      'Post flairs for cats'
    );
  });

  it('uses a color dot without making arbitrary flair colors the text background', () => {
    const wrapper = mount(DiscussionFlairBadges, { props: { flairs } });
    expect(wrapper.get('[style]').attributes('style')).toContain(
      'background-color: #112233'
    );
  });
});

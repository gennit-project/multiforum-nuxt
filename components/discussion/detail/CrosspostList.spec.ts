import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CrosspostList from './CrosspostList.vue';

const mountList = (props: Record<string, unknown>) =>
  mount(CrosspostList, {
    props: { discussionId: 'd1', ...props },
    global: {
      stubs: {
        'nuxt-link': { template: '<a><slot /></a>' },
        Tag: { template: '<span class="tag" />' },
      },
    },
  });

describe('CrosspostList', () => {
  it('renders the heading', () => {
    expect(mountList({}).text()).toContain('Crossposted To Channels');
  });

  it('renders a row per channel link', () => {
    const wrapper = mountList({
      channelLinks: [{ uniqueName: 'cats' }, { uniqueName: 'dogs' }],
    });
    expect(wrapper.findAll('li')).toHaveLength(2);
  });

  it('uses the getCommentCount callback for the count label', () => {
    const wrapper = mountList({
      channelLinks: [{ uniqueName: 'cats' }],
      getCommentCount: () => 7,
    });
    expect(wrapper.text()).toContain('7 comments');
  });
});

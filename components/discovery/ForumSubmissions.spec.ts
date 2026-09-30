import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ForumSubmissions from './ForumSubmissions.vue';
vi.mock('nuxt/app', () => ({
  useRoute: () => ({ path: '/discussions', query: { searchInput: 'cats' } }),
}));
const submissions = Array.from({ length: 7 }, (_, i) => ({
  channelUniqueName: `forum-${i}`,
  CommentsAggregate: { count: i },
}));
const mountForums = (props = {}) =>
  mount(ForumSubmissions, {
    props: { submissions, contentId: 'topic', kind: 'discussion', ...props },
    global: {
      stubs: {
        NuxtLink: {
          name: 'NuxtLink',
          props: ['to'],
          template: '<a><slot /></a>',
        },
      },
    },
  });
describe('ForumSubmissions', () => {
  it('shows exactly four forums initially', () => {
    expect(mountForums().findAll('li')).toHaveLength(4);
  });
  it('reveals every forum, including zero-comment conversations', async () => {
    const wrapper = mountForums();
    await wrapper.get('button').trigger('click');
    expect({
      count: wrapper.findAll('li').length,
      expanded: wrapper.get('button').attributes('aria-expanded'),
      zero: wrapper.find('[aria-label="forum-0: 0 comments"]').exists(),
    }).toEqual({ count: 7, expanded: 'true', zero: true });
  });
  it('collapses back to four', async () => {
    const wrapper = mountForums();
    await wrapper.get('button').trigger('click');
    await wrapper.get('button').trigger('click');
    expect(wrapper.findAll('li')).toHaveLength(4);
  });
  it('does not offer expansion for four forums', () => {
    expect(
      mountForums({ submissions: submissions.slice(0, 4) })
        .find('button')
        .exists()
    ).toBe(false);
  });
  it('keeps a selected forum beyond the first four visible', () => {
    expect(
      mountForums({ selectedForum: 'forum-6' })
        .get('[aria-current]')
        .attributes('aria-label')
    ).toBe('forum-6: 6 comments');
  });
  it('preserves search filters when opening a forum-specific preview', () => {
    const wrapper = mountForums({ preview: true });
    expect(
      wrapper.findAllComponents({ name: 'NuxtLink' })[1].props('to')
    ).toEqual({
      path: '/discussions',
      query: {
        searchInput: 'cats',
        selectedDiscussionId: 'topic',
        selectedForum: 'forum-0',
      },
    });
  });
  it('links directly to the forum conversation on mobile', () => {
    expect(
      mountForums({ preview: true })
        .findComponent({ name: 'NuxtLink' })
        .props('to')
    ).toBe('/forums/forum-0/discussions/topic');
  });
  it('never presents separate comment counts for event forums', () => {
    const wrapper = mountForums({ kind: 'event' });
    expect({
      counts: wrapper.findAll('svg').length,
      label: wrapper.get('a').attributes('aria-label'),
      link: wrapper.findComponent({ name: 'NuxtLink' }).props('to'),
    }).toEqual({
      counts: 0,
      label: 'View event in forum-0',
      link: '/forums/forum-0/events/topic',
    });
  });
  it('omits the forum section when there are no submissions', () => {
    expect(
      mountForums({ submissions: [] })
        .find('[data-testid="forum-submissions"]')
        .exists()
    ).toBe(false);
  });
});

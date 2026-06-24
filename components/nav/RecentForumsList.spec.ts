import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

import RecentForumsList from '@/components/nav/RecentForumsList.vue';

const h = vi.hoisted(() => ({ push: vi.fn(() => Promise.resolve()) }));

vi.mock('nuxt/app', () => ({ useRouter: () => ({ push: h.push }) }));

const forum = (name: string) => ({ uniqueName: name, timestamp: 1 });

const mountList = (props: Record<string, unknown> = {}) =>
  mount(RecentForumsList, {
    props: { forums: [forum('cats')], ...props },
    global: { stubs: { AvatarComponent: true } },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.push = vi.fn(() => Promise.resolve());
});

describe('RecentForumsList', () => {
  it('renders a forum', () => {
    const wrapper = mountList();

    expect(wrapper.text()).toContain('cats');
  });

  it('renders nothing when there are no forums', () => {
    const wrapper = mountList({ forums: [] });

    expect(wrapper.text()).toBe('');
  });

  it('shows the header when enabled', () => {
    const wrapper = mountList({ showHeader: true });

    expect(wrapper.text()).toContain('Recent Forums');
  });

  it('navigates to the forum on click', async () => {
    const wrapper = mountList();

    await wrapper.get('button').trigger('click');

    expect(h.push).toHaveBeenCalledWith(
      expect.objectContaining({ params: { forumId: 'cats' } })
    );
  });

  it('calls the onNavigate callback after navigating', async () => {
    const onNavigate = vi.fn();
    const wrapper = mountList({ onNavigate });

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(onNavigate).toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import RecentForumsDrawer from '@/components/nav/RecentForumsDrawer.vue';

const h = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('nuxt/app', () => ({ useRouter: () => ({ push: h.push }) }));

const forum = (name: string) => ({ uniqueName: name, timestamp: 1 });

const mountDrawer = (props: Record<string, unknown> = {}) =>
  mount(RecentForumsDrawer, {
    props: { forums: [forum('cats')], isOpen: true, ...props },
    global: {
      stubs: {
        ClientOnly: { template: '<div><slot /></div>' },
        Transition: { template: '<div><slot /></div>' },
        RecentForumsList: { name: 'RecentForumsList', props: ['forums', 'onNavigate'], template: '<div class="list" />' },
        // ForumFinder queries GraphQL; stub it and expose a button that emits
        // the select event so we can assert navigation without wiring Apollo.
        ForumFinder: {
          name: 'ForumFinder',
          emits: ['select'],
          template:
            '<button class="finder-select" @click="$emit(\'select\', \'dogs\')" />',
        },
        SearchIcon: true,
      },
    },
  });

const findForumButton = (w: ReturnType<typeof mount>) =>
  w.findAll('button').find((b) => b.text().includes('Find Forum'));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RecentForumsDrawer visibility', () => {
  it('shows the drawer when open', () => {
    const wrapper = mountDrawer({ isOpen: true });

    expect(wrapper.text()).toContain('Recent Forums');
  });

  it('marks the open drawer as a modal dialog labelled by its heading', () => {
    const wrapper = mountDrawer({ isOpen: true });

    expect({
      role: wrapper.get('[role="dialog"]').attributes('role'),
      modal: wrapper.get('[role="dialog"]').attributes('aria-modal'),
      labelledby: wrapper.get('[role="dialog"]').attributes('aria-labelledby'),
      titleId: wrapper.get('h3').attributes('id'),
    }).toEqual({
      role: 'dialog',
      modal: 'true',
      labelledby: 'recent-forums-drawer-title',
      titleId: 'recent-forums-drawer-title',
    });
  });

  it('hides the drawer when closed', () => {
    const wrapper = mountDrawer({ isOpen: false });

    expect(wrapper.text()).not.toContain('Recent Forums');
  });

  it('shows an empty message when there are no forums', () => {
    const wrapper = mountDrawer({ forums: [] });

    expect(wrapper.text()).toContain('No recent forums yet');
  });

  it('renders the forums list', () => {
    const wrapper = mountDrawer();

    expect(wrapper.find('.list').exists()).toBe(true);
  });
});

describe('RecentForumsDrawer actions', () => {
  it('emits close from the backdrop', async () => {
    const wrapper = mountDrawer();

    await wrapper.find('.bg-opacity-50').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('reveals the forum finder when Find Forum is clicked', async () => {
    const wrapper = mountDrawer();

    await findForumButton(wrapper)!.trigger('click');

    expect(wrapper.findComponent({ name: 'ForumFinder' }).exists()).toBe(true);
  });

  it('navigates to the selected forum and closes', async () => {
    const wrapper = mountDrawer();
    await findForumButton(wrapper)!.trigger('click');

    await wrapper.find('.finder-select').trigger('click');

    expect(h.push).toHaveBeenCalledWith({
      name: 'forums-forumId-discussions',
      params: { forumId: 'dogs' },
    });
  });

  it('emits close after selecting a forum', async () => {
    const wrapper = mountDrawer();
    await findForumButton(wrapper)!.trigger('click');

    await wrapper.find('.finder-select').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

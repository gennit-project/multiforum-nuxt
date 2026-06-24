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
      },
    },
  });

const addForumButton = (w: ReturnType<typeof mount>) =>
  w.findAll('button').find((b) => b.text().includes('Add Forum'));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RecentForumsDrawer visibility', () => {
  it('shows the drawer when open', () => {
    const wrapper = mountDrawer({ isOpen: true });

    expect(wrapper.text()).toContain('Recent Forums');
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

  it('navigates to create-forum and closes', async () => {
    const wrapper = mountDrawer();

    await addForumButton(wrapper)!.trigger('click');

    expect(h.push).toHaveBeenCalledWith('/forums/create');
  });

  it('emits close after navigating to create-forum', async () => {
    const wrapper = mountDrawer();

    await addForumButton(wrapper)!.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

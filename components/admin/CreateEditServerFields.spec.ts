import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import CreateEditServerFields from '@/components/admin/CreateEditServerFields.vue';

const h = vi.hoisted(() => ({ route: null as unknown, push: vi.fn() }));

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
  useRouter: () => ({ push: h.push }),
}));

const routerLinkStub = { name: 'RouterLink', props: ['to'], template: '<a><slot /></a>' };

const mountFields = (props: Record<string, unknown> = {}) =>
  mount(CreateEditServerFields, {
    props: { editMode: true, formValues: {}, ...props },
    global: {
      stubs: {
        TailwindForm: { name: 'TailwindForm', emits: ['submit'], template: '<form><slot /></form>' },
        NuxtPage: { name: 'NuxtPage', emits: ['submit', 'update-form-values'], template: '<div />' },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
        RouterLink: routerLinkStub,
        'router-link': routerLinkStub,
        CogIcon: true,
        BookIcon: true,
        CalendarIcon: true,
        DownloadIcon: true,
      },
    },
  });

const dropdownToggle = (w: ReturnType<typeof mount>) =>
  w.findAll('button').find((b) => b.text().length > 0);

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { name: 'admin-settings-basic' };
});

describe('CreateEditServerFields states', () => {
  it('shows a loading message while the server loads', () => {
    const wrapper = mountFields({ serverLoading: true });

    expect(wrapper.text()).toContain('Loading');
  });

  it('shows update errors', () => {
    const wrapper = mountFields({
      updateServerError: { message: 'update failed', graphQLErrors: [] },
    });

    expect(wrapper.text()).toContain('update failed');
  });

  it('shows create errors', () => {
    const wrapper = mountFields({
      createServerError: { graphQLErrors: [{ message: 'create failed' }] },
    });

    expect(wrapper.text()).toContain('create failed');
  });

  it('renders the settings form in edit mode', () => {
    const wrapper = mountFields();

    expect(wrapper.findComponent({ name: 'TailwindForm' }).exists()).toBe(true);
  });
});

describe('CreateEditServerFields tab redirect', () => {
  it('redirects to the basic tab when landing on the bare settings route', () => {
    h.route = { name: 'admin-settings' };
    mountFields();

    expect(h.push).toHaveBeenCalledWith({ name: 'admin-settings-basic' });
  });

  it('does not redirect when already on a tab', () => {
    h.route = { name: 'admin-settings-rules' };
    mountFields();

    expect(h.push).not.toHaveBeenCalled();
  });
});

describe('CreateEditServerFields current tab label', () => {
  it('reflects the active tab in the dropdown toggle', () => {
    h.route = { name: 'admin-settings-rules' };
    const wrapper = mountFields();

    expect(dropdownToggle(wrapper)!.text()).toContain('Rules');
  });

  it('falls back to "Settings" when no tab matches', () => {
    h.route = { name: 'admin-something-else' };
    const wrapper = mountFields();

    expect(dropdownToggle(wrapper)!.text()).toContain('Settings');
  });
});

describe('CreateEditServerFields interaction', () => {
  it('opens the mobile tab dropdown', async () => {
    const wrapper = mountFields();

    await dropdownToggle(wrapper)!.trigger('click');

    expect(wrapper.find('ul').exists()).toBe(true);
  });

  it('re-emits submit from the form', async () => {
    const wrapper = mountFields();

    await wrapper.getComponent({ name: 'TailwindForm' }).vm.$emit('submit');

    expect(wrapper.emitted('submit')).toBeTruthy();
  });

  it('re-emits form value updates from the nested page', async () => {
    const wrapper = mountFields();

    await wrapper
      .getComponent({ name: 'NuxtPage' })
      .vm.$emit('update-form-values', { serverName: 'X' });

    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([{ serverName: 'X' }]);
  });
});

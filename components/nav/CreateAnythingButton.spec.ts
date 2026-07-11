import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import CreateAnythingButton from '@/components/nav/CreateAnythingButton.vue';

// @floating-ui/vue's useFloating + autoUpdate loops under jsdom; stub it (the
// menu's open/close + navigation logic is what these tests exercise).
vi.mock('@floating-ui/vue', () => ({
  useFloating: () => ({ floatingStyles: ref({}) }),
  offset: () => ({}),
  flip: () => ({}),
  shift: () => ({}),
  autoUpdate: () => () => {},
}));

// Per-file nuxt/app mock: controllable route + a router.push spy for the menu
// item actions. The global mock works too but we need to vary route here.
const nuxt = vi.hoisted(() => ({
  route: { params: {}, query: {}, name: 'home' },
  push: vi.fn(),
}));
vi.mock('nuxt/app', () => ({
  useRoute: () => nuxt.route,
  useRouter: () => ({ push: nuxt.push }),
  useState: <T>(_k: string, init?: () => T) => ref(init ? init() : undefined),
  useNuxtApp: () => ({ $apollo: { default: { query: vi.fn() } } }),
}));

// Stub RequireAuth to render whichever slot we want, so we can exercise both the
// authenticated menu and the unauthenticated placeholder without real auth.
const requireAuthStub = (slot: 'has-auth' | 'does-not-have-auth') => ({
  name: 'RequireAuth',
  template: `<div><slot name="${slot}" /></div>`,
});

// Render client-only + teleported content inline so the menu items mount within
// the wrapper once the menu is opened.
const componentStubs = {
  ClientOnly: { template: '<div><slot /></div>' },
  Teleport: { template: '<div><slot /></div>' },
  ChevronDownIcon: true,
};

const mountButton = (
  slot: 'has-auth' | 'does-not-have-auth',
  props: Record<string, unknown> = {}
) =>
  mount(CreateAnythingButton, {
    props,
    global: {
      stubs: { RequireAuth: requireAuthStub(slot), ...componentStubs },
    },
  });

// The menu panel is v-if the trigger is open; click the trigger first.
const openMenu = async (wrapper: ReturnType<typeof mountButton>) => {
  await wrapper.get('button[aria-haspopup="menu"]').trigger('click');
  return wrapper;
};

beforeEach(() => {
  nuxt.route = { params: {}, query: {}, name: 'home' };
  nuxt.push.mockReset();
});

describe('CreateAnythingButton classes', () => {
  it('uses the round icon-only style when iconOnly is set', () => {
    const wrapper = mountButton('does-not-have-auth', { iconOnly: true });

    expect(wrapper.get('button').classes()).toContain('rounded-full');
  });

  it('shows "Create" wording when usePrimaryButton is set', () => {
    const wrapper = mountButton('does-not-have-auth', { usePrimaryButton: true });

    expect(wrapper.get('button').text()).toContain('Create');
  });

  it('applies the light background style by default', () => {
    const wrapper = mountButton('does-not-have-auth');

    expect(wrapper.get('button').classes()).toContain('bg-white');
  });

  it('applies the dark-mode background style when backgroundColor is dark', () => {
    const wrapper = mountButton('does-not-have-auth', {
      backgroundColor: 'dark',
    });

    expect(wrapper.get('button').classes()).toContain('dark:bg-gray-800');
  });

  // Regression: the non-icon variant used focus:outline-none with no ring width,
  // leaving keyboard focus invisible (WCAG 2.4.7).
  it('renders a focus ring width on the default (non-icon) variant', () => {
    const wrapper = mountButton('does-not-have-auth');

    expect(wrapper.get('button').classes()).toContain('focus-visible:ring-2');
  });
});

describe('CreateAnythingButton menu actions (sitewide)', () => {
  it('navigates to the global discussion create page', async () => {
    const wrapper = mountButton('has-auth');

    await openMenu(wrapper);

    await wrapper.get('[data-testid="create-discussion-menu-item"]').trigger('click');

    expect(nuxt.push).toHaveBeenCalledWith('/discussions/create');
  });

  it('navigates to the global event create page', async () => {
    const wrapper = mountButton('has-auth');

    await openMenu(wrapper);

    await wrapper.get('[data-testid="create-event-menu-item"]').trigger('click');

    expect(nuxt.push).toHaveBeenCalledWith('/events/create');
  });

  it('navigates to the forum create page', async () => {
    const wrapper = mountButton('has-auth');

    await openMenu(wrapper);

    await wrapper.get('[data-testid="create-channel-menu-item"]').trigger('click');

    expect(nuxt.push).toHaveBeenCalledWith('/forums/create');
  });
});

describe('CreateAnythingButton menu actions (forum-scoped)', () => {
  beforeEach(() => {
    nuxt.route = { params: { forumId: 'cats' }, query: {}, name: 'forum' };
  });

  it('scopes the discussion create route to the current forum', async () => {
    const wrapper = mountButton('has-auth');

    await openMenu(wrapper);

    await wrapper.get('[data-testid="create-discussion-menu-item"]').trigger('click');

    expect(nuxt.push).toHaveBeenCalledWith('/forums/cats/discussions/create');
  });

  it('scopes the event create route to the current forum', async () => {
    const wrapper = mountButton('has-auth');

    await openMenu(wrapper);

    await wrapper.get('[data-testid="create-event-menu-item"]').trigger('click');

    expect(nuxt.push).toHaveBeenCalledWith('/forums/cats/events/create');
  });
});

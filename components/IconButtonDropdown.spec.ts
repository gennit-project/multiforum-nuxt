import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

import IconButtonDropdown from '@/components/IconButtonDropdown.vue';

const h = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('nuxt/app', () => ({ useRouter: () => ({ push: h.push }) }));
vi.mock('@headlessui/vue', () => ({
  Menu: { name: 'Menu', template: '<div><slot /></div>' },
  MenuButton: { name: 'MenuButton', template: '<button class="menu-button"><slot /></button>' },
  MenuItems: { name: 'MenuItems', template: '<div><slot /></div>' },
  MenuItem: { name: 'MenuItem', template: '<div class="menu-item"><slot :active="false" /></div>' },
}));

const mountDropdown = (props: Record<string, unknown> = {}, slot = '') =>
  mount(IconButtonDropdown, {
    props: { items: [{ value: '/go', label: 'Go' }], ...props },
    slots: { default: slot },
    global: { stubs: { ClientOnly: { template: '<div><slot /></div>' } } },
  });

const items = (w: ReturnType<typeof mount>) => w.findAll('.menu-item');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('IconButtonDropdown rendering', () => {
  it('renders the menu items', () => {
    const wrapper = mountDropdown({ items: [{ value: '/a', label: 'Item A' }] });

    expect(wrapper.text()).toContain('Item A');
  });

  it('renders a divider item', () => {
    const wrapper = mountDropdown({ items: [{ value: 'Section', isDivider: true }] });

    expect(wrapper.text()).toContain('Section');
  });

  it('renders the slot in the button when no icon is given', () => {
    const wrapper = mountDropdown({}, '<span class="custom">menu</span>');

    expect(wrapper.find('.custom').exists()).toBe(true);
  });

  it('applies the aria-label to the button', () => {
    const wrapper = mountDropdown({ ariaLabel: 'Open menu' });

    expect(wrapper.find('.menu-button').attributes('aria-label')).toBe('Open menu');
  });
});

describe('IconButtonDropdown actions', () => {
  it('navigates to the item value when there is no event', async () => {
    const wrapper = mountDropdown({ items: [{ value: '/profile', label: 'Profile' }] });

    await items(wrapper)[0].trigger('click');

    expect(h.push).toHaveBeenCalledWith('/profile');
  });

  it('emits the item event with its value', async () => {
    const wrapper = mountDropdown({
      items: [{ value: 'logout-val', label: 'Log out', event: 'logout' }],
    });

    await items(wrapper)[0].trigger('click');

    expect(wrapper.emitted('logout')?.[0]).toEqual(['logout-val']);
  });

  it('does not navigate for an event-based item', async () => {
    const wrapper = mountDropdown({
      items: [{ value: 'x', label: 'X', event: 'doX' }],
    });

    await items(wrapper)[0].trigger('click');

    expect(h.push).not.toHaveBeenCalled();
  });
});

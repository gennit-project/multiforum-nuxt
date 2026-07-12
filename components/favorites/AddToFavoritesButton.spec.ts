import { describe, it, expect } from 'vitest';
import { defineComponent, h } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import AddToFavoritesButton from '@/components/favorites/AddToFavoritesButton.vue';

const AddToListPopoverStub = defineComponent({
  name: 'AddToListPopover',
  template: '<div class="add-to-list-popover-stub" />',
});

vi.mock('@/components/collection/AddToListPopover.vue', () => ({
  default: AddToListPopoverStub,
}));

// Override the default RequireAuth stub (which renders the has-auth slot) to
// render the unauthenticated branch instead.
const RequireAuthUnauth = defineComponent({
  name: 'RequireAuth',
  setup(_props, { slots }) {
    return () => h('div', slots['does-not-have-auth']?.());
  },
});

// RequireAuth is stubbed by mountWithDefaults (renders the has-auth slot);
// AddToListPopover is async and Apollo-backed, so keep the global stub aligned
// with the module mock above.
const mountButton = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(AddToFavoritesButton, {
    props: { isFavorited: false, ...props },
    global: { stubs: { AddToListPopover: AddToListPopoverStub } },
  });

const mountUnauthButton = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(AddToFavoritesButton, {
    props: { isFavorited: false, ...props },
    global: {
      stubs: {
        RequireAuth: RequireAuthUnauth,
        AddToListPopover: AddToListPopoverStub,
      },
    },
  });

const clickFavorite = (wrapper: ReturnType<typeof mountButton>) =>
  wrapper.get('[aria-label]').trigger('click');

describe('AddToFavoritesButton', () => {
  it('labels the button "Add … to favorites" when not favorited', () => {
    const wrapper = mountButton({ isFavorited: false, displayName: 'Trivia' });
    expect(
      wrapper.find('[aria-label="Add Trivia to favorites"]').exists()
    ).toBe(true);
  });

  it('labels the button "Remove … from favorites" when favorited and lists are disallowed', () => {
    const wrapper = mountButton({
      isFavorited: true,
      displayName: 'Trivia',
      allowAddToList: false,
    });
    expect(
      wrapper.find('[aria-label="Remove Trivia from favorites"]').exists()
    ).toBe(true);
  });

  it('emits toggle when clicked while not favorited', async () => {
    const wrapper = mountButton({ isFavorited: false });
    await clickFavorite(wrapper);
    expect(wrapper.emitted('toggle')).toHaveLength(1);
  });

  it('does not emit toggle when favorited and lists are allowed (opens popover instead)', async () => {
    const wrapper = mountButton({ isFavorited: true, allowAddToList: true });
    await clickFavorite(wrapper);
    expect(wrapper.emitted('toggle')).toBeUndefined();
  });

  it('does nothing when loading', async () => {
    const wrapper = mountButton({ isFavorited: false, isLoading: true });
    await clickFavorite(wrapper);
    expect(wrapper.emitted('toggle')).toBeUndefined();
  });

});

describe('AddToFavoritesButton sizing', () => {
  it.each([
    ['small', 'h-4 w-4'],
    ['large', 'h-6 w-6'],
    ['medium', 'h-5 w-5'],
  ])('renders the %s icon size', (size, expected) => {
    const wrapper = mountButton({ size });
    expect(wrapper.get('svg').classes().join(' ')).toContain(expected);
  });

  it('defaults to the medium icon size', () => {
    const wrapper = mountButton();
    expect(wrapper.get('svg').classes().join(' ')).toContain('h-5 w-5');
  });
});

describe('AddToFavoritesButton tooltip', () => {
  it('shows the tooltip on hover and hides it on leave', async () => {
    // The tooltip is rendered via <Teleport to="body">, so it lands in the
    // document body rather than the component's own subtree.
    const wrapper = mountButton({ isFavorited: false });
    const button = wrapper.get('[aria-label]');

    await button.trigger('mouseenter');
    const tooltip = document.body.querySelector('.pointer-events-none');
    expect(tooltip).not.toBeNull();
    expect(tooltip?.textContent?.trim()).toBe('Add to favorites');

    await button.trigger('mouseleave');
    expect(document.body.querySelector('.pointer-events-none')).toBeNull();
    wrapper.unmount();
  });
});

describe('AddToFavoritesButton (unauthenticated)', () => {
  it('still renders a favorites button labelled to add', () => {
    const wrapper = mountUnauthButton({ displayName: 'Trivia' });
    expect(
      wrapper.find('[aria-label="Add Trivia to favorites"]').exists()
    ).toBe(true);
  });

  it('renders the unauthenticated button as clickable (cursor-pointer)', () => {
    const wrapper = mountUnauthButton();
    expect(wrapper.get('[aria-label]').classes()).toContain('cursor-pointer');
  });
});

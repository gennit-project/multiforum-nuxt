import { describe, it, expect } from 'vitest';
import { defineComponent, h } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import AddToFavoritesButton from '@/components/favorites/AddToFavoritesButton.vue';

// Override the default RequireAuth stub (which renders the has-auth slot) to
// render the unauthenticated branch instead.
const RequireAuthUnauth = defineComponent({
  name: 'RequireAuth',
  setup(_props, { slots }) {
    return () => h('div', slots['does-not-have-auth']?.());
  },
});

// A popover stub that exposes `isVisible` so the spec can assert it opens.
const PopoverStub = defineComponent({
  name: 'AddToListPopover',
  props: { isVisible: { type: Boolean, default: false } },
  template: '<div />',
});

// RequireAuth is stubbed by mountWithDefaults (renders the has-auth slot);
// AddToListPopover is Apollo-backed, so stub it here.
const mountButton = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(AddToFavoritesButton, {
    props: { isFavorited: false, ...props },
    global: { stubs: { AddToListPopover: true } },
  });

const mountUnauthButton = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(AddToFavoritesButton, {
    props: { isFavorited: false, ...props },
    global: { stubs: { RequireAuth: RequireAuthUnauth, AddToListPopover: true } },
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

  it('opens the collection popover when clicked while favorited', async () => {
    const wrapper = mountWithDefaults(AddToFavoritesButton, {
      props: { isFavorited: true, allowAddToList: true },
      global: { stubs: { AddToListPopover: PopoverStub } },
    });
    await clickFavorite(wrapper);
    expect(wrapper.getComponent(PopoverStub).props('isVisible')).toBe(true);
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

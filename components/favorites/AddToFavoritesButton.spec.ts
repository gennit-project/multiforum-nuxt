import { describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createSSRAuthMock } from '@/tests/utils/mockSSRAuth';

import AddToFavoritesButton from '@/components/favorites/AddToFavoritesButton.vue';

// RequireAuth (stubbed at render) imports useSSRAuth, which pulls nuxt/app at
// module load; mock it so importing the component doesn't crash.
vi.mock('@/composables/useSSRAuth', () => createSSRAuthMock());

// RequireAuth is stubbed by mountWithDefaults (renders the has-auth slot);
// AddToListPopover is Apollo-backed, so stub it here.
const mountButton = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(AddToFavoritesButton, {
    props: { isFavorited: false, ...props },
    global: { stubs: { AddToListPopover: true } },
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

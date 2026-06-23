import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

import AddToListPopover from '@/components/collection/AddToListPopover.vue';

// --- controllable dependency state ------------------------------------------
const h = vi.hoisted(() => {
  return {
    username: { value: 'alice' as string | null | undefined },
    collectionsResult: { value: undefined as unknown },
    itemInResult: { value: undefined as unknown },
    refetchCollections: undefined as unknown,
    refetchItem: undefined as unknown,
    showToast: undefined as unknown,
    createCollection: undefined as unknown,
    addMutation: undefined as unknown,
    removeMutation: undefined as unknown,
    addFav: undefined as unknown,
    removeFav: undefined as unknown,
    useQuery: undefined as unknown,
  };
});

vi.mock('@vue/apollo-composable', () => ({
  useQuery: (...args: unknown[]) =>
    (h.useQuery as (...a: unknown[]) => unknown)(...args),
}));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => h.username,
}));
vi.mock('@/stores/toastStore', () => ({
  useToastStore: () => ({ showToast: h.showToast }),
}));
vi.mock('@/composables/useCollectionQueries', () => ({
  useCollectionQueries: () => ({
    collectionType: 'Discussion',
    getCollectionQuery: () => ({}),
    getCheckItemQuery: () => ({}),
  }),
}));
vi.mock('@/composables/useCollectionMutations', () => ({
  useCollectionMutations: () => ({
    createCollection: h.createCollection,
    getAddMutation: () => h.addMutation,
    getRemoveMutation: () => h.removeMutation,
    getAddFavoriteMutation: () => h.addFav,
    getRemoveFavoriteMutation: () => h.removeFav,
  }),
}));
vi.mock('@/composables/usePopoverPositioning', () => ({
  usePopoverPositioning: () => ({ adjustedPosition: ref({ top: 0, left: 0 }) }),
}));

const mountPopover = (props: Record<string, unknown> = {}) =>
  mount(AddToListPopover, {
    props: { itemId: 'item-1', itemType: 'discussion', isVisible: true, ...props },
    global: { stubs: { Teleport: { template: '<div><slot /></div>' } } },
  });

const rows = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('.cursor-pointer');

beforeEach(() => {
  h.username.value = 'alice';
  h.collectionsResult = ref({
    users: [
      {
        Collections: [{ id: 'c1', name: 'My List', itemCount: 3 }],
        FavoriteDiscussions: [],
      },
    ],
  }) as never;
  h.itemInResult = ref({ users: [{ Collections: [] }] }) as never;
  h.refetchCollections = vi.fn();
  h.refetchItem = vi.fn();
  h.showToast = vi.fn();
  h.createCollection = vi.fn();
  h.addMutation = vi.fn().mockResolvedValue({});
  h.removeMutation = vi.fn().mockResolvedValue({});
  h.addFav = vi.fn().mockResolvedValue({});
  h.removeFav = vi.fn().mockResolvedValue({});
  h.useQuery = vi
    .fn()
    .mockReturnValueOnce({
      result: h.collectionsResult,
      refetch: h.refetchCollections,
    })
    .mockReturnValueOnce({ result: h.itemInResult, refetch: h.refetchItem });
});

describe('AddToListPopover visibility', () => {
  it('renders nothing when not visible', () => {
    const wrapper = mountPopover({ isVisible: false });

    expect(wrapper.text()).toBe('');
  });

  it('renders the dialog when visible', () => {
    const wrapper = mountPopover();

    expect(wrapper.text()).toContain('Add to List');
  });
});

describe('AddToListPopover list rendering', () => {
  it('always shows the Favorites row', () => {
    const wrapper = mountPopover();

    expect(wrapper.text()).toContain('Favorites');
  });

  it('lists the user collections with their item count', () => {
    const wrapper = mountPopover();

    expect(wrapper.text()).toContain('My List');
  });

  it('shows the empty state when there are no collections', () => {
    h.collectionsResult = ref({
      users: [{ Collections: [], FavoriteDiscussions: [] }],
    }) as never;
    h.useQuery = vi
      .fn()
      .mockReturnValueOnce({ result: h.collectionsResult, refetch: vi.fn() })
      .mockReturnValueOnce({ result: h.itemInResult, refetch: vi.fn() });
    const wrapper = mountPopover();

    expect(wrapper.text()).toContain('No collections yet');
  });

  it('shows a no-results message when a search matches nothing', async () => {
    const wrapper = mountPopover();

    await wrapper.get('input[aria-label="Search lists"]').setValue('zzz');

    expect(wrapper.text()).toContain('No collections found');
  });
});

describe('AddToListPopover favorites toggle', () => {
  it('adds a discussion to favorites with a discussionId param', async () => {
    const wrapper = mountPopover();

    await rows(wrapper)[0].trigger('click');
    await flushPromises();

    expect(h.addFav).toHaveBeenCalledWith({
      discussionId: 'item-1',
      username: 'alice',
    });
  });

  it('emits favoriteChange(true) when favoriting', async () => {
    const wrapper = mountPopover();

    await rows(wrapper)[0].trigger('click');
    await flushPromises();

    expect(wrapper.emitted('favoriteChange')?.[0]).toEqual([true]);
  });

  it('removes from favorites when already favorited', async () => {
    const wrapper = mountPopover({ isAlreadyFavorite: true });

    await rows(wrapper)[0].trigger('click');
    await flushPromises();

    expect(h.removeFav).toHaveBeenCalled();
  });

  it('uses a channel param for channel favorites', async () => {
    const wrapper = mountPopover({ itemType: 'channel' });

    await rows(wrapper)[0].trigger('click');
    await flushPromises();

    expect(h.addFav).toHaveBeenCalledWith({
      channel: 'item-1',
      username: 'alice',
    });
  });

  it('uses a discussionId param for download favorites', async () => {
    const wrapper = mountPopover({ itemType: 'download' });

    await rows(wrapper)[0].trigger('click');
    await flushPromises();

    expect(h.addFav).toHaveBeenCalledWith({
      discussionId: 'item-1',
      username: 'alice',
    });
  });
});

describe('AddToListPopover collection toggle', () => {
  it('adds the item to a collection it is not in', async () => {
    const wrapper = mountPopover();

    await rows(wrapper)[1].trigger('click');
    await flushPromises();

    expect(h.addMutation).toHaveBeenCalledWith({
      collectionId: 'c1',
      itemId: 'item-1',
    });
  });

  it('removes the item from a collection it is already in', async () => {
    h.itemInResult = ref({ users: [{ Collections: [{ id: 'c1' }] }] }) as never;
    h.useQuery = vi
      .fn()
      .mockReturnValueOnce({ result: h.collectionsResult, refetch: vi.fn() })
      .mockReturnValueOnce({ result: h.itemInResult, refetch: vi.fn() });
    const wrapper = mountPopover();

    await rows(wrapper)[1].trigger('click');
    await flushPromises();

    expect(h.removeMutation).toHaveBeenCalledWith({
      collectionId: 'c1',
      itemId: 'item-1',
    });
  });
});

describe('AddToListPopover create new collection', () => {
  it('creates a collection and adds the item to it', async () => {
    (h.createCollection as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        createCollections: { collections: [{ id: 'new1', name: 'New List' }] },
      },
    });
    const wrapper = mountPopover();

    await wrapper.findAll('button').find((b) => b.text().includes('New List'))!.trigger('click');
    await wrapper.get('input[aria-label="New list name"]').setValue('New List');
    await wrapper.findAll('button').find((b) => b.text() === 'Create')!.trigger('click');
    await flushPromises();

    expect(h.addMutation).toHaveBeenCalledWith({
      collectionId: 'new1',
      itemId: 'item-1',
    });
  });
});

describe('AddToListPopover dismissal', () => {
  it('emits close when the Escape key is pressed', async () => {
    const wrapper = mountPopover();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await flushPromises();

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close when clicking outside the popover', async () => {
    const wrapper = mountPopover();
    // the outside-click listener is attached on a setTimeout(0)
    await new Promise((r) => setTimeout(r, 5));

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

describe('AddToListPopover item-type variants', () => {
  it.each(['comment', 'image'])(
    'renders the favorites row for the %s item type',
    (itemType) => {
      const wrapper = mountPopover({ itemType });

      expect(wrapper.text()).toContain('Favorites');
    }
  );
});

describe('AddToListPopover modal variant', () => {
  it('renders a modal dialog when variant is modal', () => {
    const wrapper = mountPopover({ variant: 'modal' });

    expect(wrapper.find('[aria-modal="true"]').exists()).toBe(true);
  });

  it('emits close when the modal backdrop is clicked', async () => {
    const wrapper = mountPopover({ variant: 'modal' });

    await wrapper.get('.bg-black\\/50').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

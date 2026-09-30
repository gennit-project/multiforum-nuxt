import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import LibraryFavoriteRowActions from './LibraryFavoriteRowActions.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import type { LibraryFavoriteKind } from '@/types/library';

const mocks = vi.hoisted(() => ({
  username: null as unknown as { value: string },
  openModal: vi.fn(),
  showToast: vi.fn(),
  mutate: [vi.fn(), vi.fn(), vi.fn(), vi.fn()],
  done: [] as Array<() => void>,
  errors: [] as Array<() => void>,
  mutationIndex: 0,
}));

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  mocks.username = ref('alice');
  return { useUsername: () => mocks.username };
});

vi.mock('@/stores/addToListModalStore', () => ({
  useAddToListModalStore: () => ({ open: mocks.openModal }),
}));

vi.mock('@/stores/toastStore', () => ({
  useToastStore: () => ({ showToast: mocks.showToast }),
}));

vi.mock('@headlessui/vue', () => ({
  Menu: { name: 'Menu', template: '<div><slot /></div>' },
  MenuButton: {
    name: 'MenuButton',
    template: '<button v-bind="$attrs"><slot /></button>',
  },
  MenuItems: { name: 'MenuItems', template: '<div><slot /></div>' },
  MenuItem: {
    name: 'MenuItem',
    methods: { close() {} },
    template: '<div><slot :active="false" :close="close" /></div>',
  },
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  return {
    useMutation: () => {
      const index = mocks.mutationIndex++;
      return {
        mutate: mocks.mutate[index],
        loading: ref(false),
        onDone: (callback: () => void) => {
          mocks.done[index] = callback;
        },
        onError: (callback: () => void) => {
          mocks.errors[index] = callback;
        },
      };
    },
  };
});

const mountActions = (itemKind: LibraryFavoriteKind = 'discussion') =>
  mountWithDefaults(LibraryFavoriteRowActions, {
    props: {
      itemId: 'item-1',
      itemKind,
      itemTitle: 'Saved item',
    },
  });

const openMenu = async (itemKind: LibraryFavoriteKind = 'discussion') => {
  const wrapper = mountActions(itemKind);
  await wrapper
    .get('button[aria-label="Actions for Saved item"]')
    .trigger('click');
  await flushPromises();
  return wrapper;
};

const clickAction = async (
  wrapper: ReturnType<typeof mountActions>,
  label: string
) => {
  const button = wrapper
    .findAll('button')
    .find((item) => item.text().includes(label));
  await button!.trigger('click');
  await flushPromises();
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mutationIndex = 0;
  mocks.done = [];
  mocks.errors = [];
  mocks.username.value = 'alice';
});

describe('LibraryFavoriteRowActions', () => {
  it('opens the collection picker from the far-right action menu', async () => {
    const wrapper = await openMenu('image');
    await clickAction(wrapper, 'Add to collection');
    expect(mocks.openModal).toHaveBeenCalledWith({
      itemId: 'item-1',
      itemType: 'image',
      isAlreadyFavorite: true,
    });
  });

  it.each([
    ['discussion', 0, { discussionId: 'item-1', username: 'alice' }],
    ['download', 0, { discussionId: 'item-1', username: 'alice' }],
    ['comment', 1, { commentId: 'item-1', username: 'alice' }],
    ['image', 2, { imageId: 'item-1', username: 'alice' }],
    ['channel', 3, { channel: 'item-1', username: 'alice' }],
  ] as const)(
    'removes a %s favorite with the correct mutation',
    async (kind, index, variables) => {
      const wrapper = await openMenu(kind);
      await clickAction(wrapper, 'Remove from favorites');
      expect(mocks.mutate[index]).toHaveBeenCalledWith(variables);
    }
  );

  it('emits removed only after the server mutation succeeds', async () => {
    const wrapper = await openMenu('image');
    await clickAction(wrapper, 'Remove from favorites');
    mocks.done[2]();
    expect(wrapper.emitted('removed')).toEqual([['item-1']]);
  });

  it('shows an error toast when removal fails', async () => {
    const wrapper = await openMenu('comment');
    await clickAction(wrapper, 'Remove from favorites');
    mocks.errors[1]();
    expect(mocks.showToast).toHaveBeenCalledWith(
      'Could not remove “Saved item” from favorites.',
      'error'
    );
  });
});

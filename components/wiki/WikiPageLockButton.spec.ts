import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import WikiPageLockButton from './WikiPageLockButton.vue';

const h = vi.hoisted(() => ({
  lockMutate: vi.fn(async () => ({ data: { lockWikiPage: { id: 'wiki-1' } } })),
  unlockMutate: vi.fn(async () => ({
    data: { unlockWikiPage: { id: 'wiki-1' } },
  })),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (document: { definitions?: Array<{ name?: { value?: string } }> }) => {
    const operationName = document.definitions?.[0]?.name?.value;
    return {
      mutate: operationName === 'unlockWikiPage' ? h.unlockMutate : h.lockMutate,
      loading: ref(false),
    };
  },
}));

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock('@/composables/useWikiPageLockPermissions', () => ({
  useWikiPageLockPermissions: () => ({
    canManageWikiPageLock: ref(true),
    loading: ref(false),
  }),
}));

const channel = {
  __typename: 'Channel',
  uniqueName: 'cats',
  Admins: [],
  Moderators: [],
  SuspendedMods: [],
  SuspendedUsers: [],
  DefaultModRole: { canDeleteWiki: true },
  ElevatedModRole: { canDeleteWiki: true },
};

const mountButton = (locked = false) =>
  mount(WikiPageLockButton, {
    props: {
      channel,
      channelUniqueName: 'cats',
      wikiPage: {
        id: 'wiki-1',
        locked,
        lockedAt: null,
        lockReason: null,
        lockedByUsername: null,
      },
    },
  });

describe('WikiPageLockButton', () => {
  beforeEach(() => {
    h.lockMutate.mockClear();
    h.unlockMutate.mockClear();
  });

  it('locks a wiki page with a reason', async () => {
    const wrapper = mountButton(false);
    await wrapper.get('button').trigger('click');
    await wrapper.get('textarea').setValue('Spam edits');
    await wrapper.get('form').trigger('submit.prevent');

    expect(h.lockMutate).toHaveBeenCalledWith({
      channelUniqueName: 'cats',
      wikiPageId: 'wiki-1',
      reason: 'Spam edits',
    });
  });

  it('unlocks a locked wiki page', async () => {
    const wrapper = mountButton(true);
    await wrapper.get('button').trigger('click');

    expect(h.unlockMutate).toHaveBeenCalledWith({
      channelUniqueName: 'cats',
      wikiPageId: 'wiki-1',
    });
  });
});

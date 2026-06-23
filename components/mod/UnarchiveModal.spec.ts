import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import UnarchiveModal from '@/components/mod/UnarchiveModal.vue';

type Slot = {
  mutate?: ReturnType<typeof vi.fn>;
  done?: () => void;
  update?: (cache: unknown) => void;
};

const h = vi.hoisted(() => ({
  client: { refetchQueries: undefined as unknown },
  disc: {} as Slot,
  evt: {} as Slot,
  comment: {} as Slot,
  callIndex: { n: 0 },
}));

vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: h.client }),
  useMutation: (_doc: unknown, options?: { update?: (c: unknown) => void }) => {
    h.callIndex.n++;
    const slot = h.callIndex.n === 1 ? h.disc : h.callIndex.n === 2 ? h.evt : h.comment;
    slot.update = options?.update;
    return {
      mutate: slot.mutate,
      loading: ref(false),
      error: ref(null),
      onDone: (cb: () => void) => {
        slot.done = cb;
      },
    };
  },
}));
vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: { forumId: 'cats' } }) }));

const stubs = {
  GenericModal: {
    name: 'GenericModal',
    props: ['title', 'body', 'open', 'loading', 'primaryButtonDisabled', 'error'],
    emits: ['primary-button-click', 'close'],
    template: '<div><slot name="content" /></div>',
  },
  TextEditor: {
    name: 'TextEditor',
    props: ['initialValue', 'placeholder'],
    emits: ['update'],
    template: '<div />',
  },
  ArchiveBoxXMark: true,
};

const mountModal = (props: Record<string, unknown> = {}) =>
  mount(UnarchiveModal, { props: { open: true, ...props }, global: { stubs } });

const modal = (wrapper: ReturnType<typeof mount>) =>
  wrapper.getComponent({ name: 'GenericModal' });

beforeEach(() => {
  h.callIndex.n = 0;
  h.disc = { mutate: vi.fn() };
  h.evt = { mutate: vi.fn() };
  h.comment = { mutate: vi.fn() };
  h.client = { refetchQueries: vi.fn() };
});

describe('UnarchiveModal labels', () => {
  it('titles the modal for a comment', () => {
    const wrapper = mountModal({ commentId: 'c1' });

    expect(modal(wrapper).props('title')).toBe('Unarchive Comment');
  });

  it('titles the modal for a discussion', () => {
    const wrapper = mountModal({ discussionId: 'd1' });

    expect(modal(wrapper).props('title')).toBe('Unarchive Discussion');
  });

  it('titles the modal for an event', () => {
    const wrapper = mountModal({ eventId: 'e1' });

    expect(modal(wrapper).props('title')).toBe('Unarchive Event');
  });

  it('describes the content type in the body', () => {
    const wrapper = mountModal({ eventId: 'e1' });

    expect(modal(wrapper).props('body')).toContain('event');
  });
});

describe('UnarchiveModal submit', () => {
  it('does nothing when no content id is provided', async () => {
    const wrapper = mountModal();

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.comment.mutate).not.toHaveBeenCalled();
  });

  it('unarchives a comment with its explanation', async () => {
    const wrapper = mountModal({ commentId: 'c1' });

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.comment.mutate).toHaveBeenCalledWith({
      commentId: 'c1',
      explanation: 'No violation',
    });
  });

  it('unarchives a discussion with the channel name', async () => {
    const wrapper = mountModal({ discussionId: 'd1' });

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.disc.mutate).toHaveBeenCalledWith({
      discussionId: 'd1',
      explanation: 'No violation',
      channelUniqueName: 'cats',
    });
  });

  it('unarchives an event with the channel name', async () => {
    const wrapper = mountModal({ eventId: 'e1' });

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.evt.mutate).toHaveBeenCalledWith({
      eventId: 'e1',
      explanation: 'No violation',
      channelUniqueName: 'cats',
    });
  });
});

describe('UnarchiveModal explanation', () => {
  it('disables the primary button when the explanation is cleared', async () => {
    const wrapper = mountModal({ discussionId: 'd1' });

    await wrapper.getComponent({ name: 'TextEditor' }).vm.$emit('update', '');

    expect(modal(wrapper).props('primaryButtonDisabled')).toBe(true);
  });
});

describe('UnarchiveModal completion', () => {
  it('refetches the issue and reports success when a discussion is unarchived', () => {
    const wrapper = mountModal({ discussionId: 'd1' });

    h.disc.done?.();

    expect(wrapper.emitted('unarchivedSuccessfully')).toBeTruthy();
  });

  it('refetches queries on completion', () => {
    mountModal({ commentId: 'c1' });

    h.comment.done?.();

    expect(h.client.refetchQueries).toHaveBeenCalled();
  });

  it('emits close when the modal is dismissed', async () => {
    const wrapper = mountModal();

    await modal(wrapper).vm.$emit('close');

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});

describe('UnarchiveModal cache updates', () => {
  const makeCache = () => ({ modify: vi.fn(), identify: vi.fn(() => 'id') });

  it('flips archived to false for the discussion channel', () => {
    mountModal({ discussionId: 'd1', discussionChannelId: 'dc1' });
    const cache = makeCache();

    h.disc.update?.(cache);

    expect(cache.modify).toHaveBeenCalled();
  });

  it('skips the cache update when no discussion channel id is present', () => {
    mountModal({ discussionId: 'd1' });
    const cache = makeCache();

    h.disc.update?.(cache);

    expect(cache.modify).not.toHaveBeenCalled();
  });

  it('flips archived to false for the comment', () => {
    mountModal({ commentId: 'c1' });
    const cache = makeCache();

    h.comment.update?.(cache);

    expect(cache.modify).toHaveBeenCalled();
  });
});

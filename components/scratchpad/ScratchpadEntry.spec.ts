import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import ScratchpadEntry from '@/components/scratchpad/ScratchpadEntry.vue';

const h = vi.hoisted(() => ({
  // useMutation is called twice: [0] update visibility, [1] delete.
  updateMutate: vi.fn(),
  updateError: null as unknown,
  onUpdateDone: undefined as undefined | (() => void),
  deleteMutate: vi.fn(),
  deleteError: null as unknown,
  onDeleteDone: undefined as undefined | (() => void),
  index: { n: 0 },
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => {
    const i = h.index.n++;
    return i === 0
      ? {
          mutate: h.updateMutate,
          loading: ref(false),
          error: h.updateError,
          onDone: (cb: () => void) => {
            h.onUpdateDone = cb;
          },
        }
      : {
          mutate: h.deleteMutate,
          loading: ref(false),
          error: h.deleteError,
          onDone: (cb: () => void) => {
            h.onDeleteDone = cb;
          },
        };
  },
}));

const entry = (overrides: Record<string, unknown> = {}) => ({
  id: 'entry-1',
  createdAt: '2024-01-01T00:00:00Z',
  text: 'Thanks!',
  isPublic: false,
  sourceType: 'comment',
  sourceId: 'src-1',
  sourceChannelUniqueName: 'cats',
  Author: { username: 'alice' },
  ...overrides,
});

const mountEntry = (props: Record<string, unknown> = {}) =>
  mount(ScratchpadEntry, {
    props: { entry: entry(), isOwner: true, ...props },
    global: {
      stubs: {
        NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
        AvatarComponent: true,
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
      },
    },
  });

const buttonByText = (w: ReturnType<typeof mount>, text: string) =>
  w.findAll('button').find((b) => b.text() === text);

beforeEach(() => {
  vi.clearAllMocks();
  h.index.n = 0;
  h.updateError = ref(null);
  h.deleteError = ref(null);
  h.onUpdateDone = undefined;
  h.onDeleteDone = undefined;
  vi.stubGlobal('confirm', vi.fn(() => true));
});

describe('ScratchpadEntry display', () => {
  it('shows the author display name when set', () => {
    const wrapper = mountEntry({
      entry: entry({ Author: { username: 'alice', displayName: 'Alice A' } }),
    });

    expect(wrapper.text()).toContain('Alice A');
  });

  it('falls back to the username', () => {
    const wrapper = mountEntry();

    expect(wrapper.text()).toContain('alice');
  });

  it('labels a comment source', () => {
    const wrapper = mountEntry();

    expect(wrapper.text()).toContain('comment');
  });

  it('labels a discussion source as a post', () => {
    const wrapper = mountEntry({ entry: entry({ sourceType: 'discussion' }) });

    expect(wrapper.text()).toContain('post');
  });

  it('shows a Pending badge for a private entry owned by the viewer', () => {
    const wrapper = mountEntry();

    expect(wrapper.text()).toContain('Pending');
  });

  it('hides owner actions for non-owners', () => {
    const wrapper = mountEntry({ isOwner: false });

    expect(wrapper.findAll('button')).toHaveLength(0);
  });
});

describe('ScratchpadEntry visibility actions', () => {
  it('makes a private entry public', async () => {
    const wrapper = mountEntry();

    await buttonByText(wrapper, 'Make Public')!.trigger('click');

    expect(h.updateMutate).toHaveBeenCalledWith({
      scratchpadEntryId: 'entry-1',
      isPublic: true,
    });
  });

  it('makes a public entry private', async () => {
    const wrapper = mountEntry({ entry: entry({ isPublic: true }) });

    await buttonByText(wrapper, 'Hide')!.trigger('click');

    expect(h.updateMutate).toHaveBeenCalledWith({
      scratchpadEntryId: 'entry-1',
      isPublic: false,
    });
  });

  it('emits updated when the update completes', () => {
    const wrapper = mountEntry();

    h.onUpdateDone?.();

    expect(wrapper.emitted('updated')).toBeTruthy();
  });
});

describe('ScratchpadEntry delete', () => {
  it('deletes after the user confirms', async () => {
    const wrapper = mountEntry();

    await buttonByText(wrapper, 'Ignore')!.trigger('click');

    expect(h.deleteMutate).toHaveBeenCalledWith({ scratchpadEntryId: 'entry-1' });
  });

  it('does not delete when the user cancels the confirm', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false));
    const wrapper = mountEntry();

    await buttonByText(wrapper, 'Ignore')!.trigger('click');

    expect(h.deleteMutate).not.toHaveBeenCalled();
  });

  it('emits deleted when the delete completes', () => {
    const wrapper = mountEntry();

    h.onDeleteDone?.();

    expect(wrapper.emitted('deleted')).toBeTruthy();
  });
});

describe('ScratchpadEntry errors', () => {
  it('shows the update error', () => {
    h.updateError = ref({ message: 'update boom' });
    const wrapper = mountEntry();

    expect(wrapper.find('.err').text()).toContain('update boom');
  });

  it('shows the delete error', () => {
    h.deleteError = ref({ message: 'delete boom' });
    const wrapper = mountEntry();

    expect(wrapper.text()).toContain('delete boom');
  });
});

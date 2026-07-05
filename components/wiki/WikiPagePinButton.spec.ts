import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';

import WikiPagePinButton from './WikiPagePinButton.vue';

const h = vi.hoisted(() => ({
  isAuthenticated: { value: true },
  username: { value: 'alice' },
  success: vi.fn(),
  error: vi.fn(),
  pinMutate: vi.fn(async () => ({ data: { pinWikiPageToChannel: true } })),
  unpinMutate: vi.fn(async () => ({ data: { unpinWikiPageFromChannel: true } })),
}));

vi.mock('@/composables/useAuthState', () => ({
  useIsAuthenticated: () => h.isAuthenticated,
  useUsername: () => h.username,
}));

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: h.success, error: h.error }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
}));

const mockedUseMutation = useMutation as unknown as ReturnType<typeof vi.fn>;

const channel = (overrides: Record<string, unknown> = {}) => ({
  uniqueName: 'cats',
  Admins: [{ username: 'alice' }],
  SuspendedUsers: [],
  DefaultChannelRole: { canUpdateChannel: false },
  ElevatedChannelRole: { canUpdateChannel: true },
  PinnedWikiPages: [],
  ...overrides,
});

const mountButton = (overrides: Record<string, unknown> = {}) =>
  mount(WikiPagePinButton, {
    props: {
      channel: channel(),
      wikiPage: { id: 'wiki-1', title: 'Intro', slug: 'intro' },
      channelUniqueName: 'cats',
      ...overrides,
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.isAuthenticated.value = true;
  h.username.value = 'alice';
  h.pinMutate.mockResolvedValue({ data: { pinWikiPageToChannel: true } });
  h.unpinMutate.mockResolvedValue({ data: { unpinWikiPageFromChannel: true } });
  mockedUseMutation
    .mockReturnValueOnce({ mutate: h.pinMutate, loading: ref(false) })
    .mockReturnValueOnce({ mutate: h.unpinMutate, loading: ref(false) });
});

describe('WikiPagePinButton', () => {
  it('pins an unpinned wiki page', async () => {
    const wrapper = mountButton();

    await wrapper.get('button').trigger('click');

    expect(h.pinMutate).toHaveBeenCalledWith({
      channelUniqueName: 'cats',
      wikiPageId: 'wiki-1',
    });
  });

  it('emits after a successful pin change', async () => {
    const wrapper = mountButton();

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('pinnedChanged')).toHaveLength(1);
  });

  it('unpins an already pinned wiki page', async () => {
    const wrapper = mountButton({
      channel: channel({
        PinnedWikiPages: [{ id: 'wiki-1', title: 'Intro', slug: 'intro' }],
      }),
    });

    await wrapper.get('button').trigger('click');

    expect(h.unpinMutate).toHaveBeenCalledWith({
      channelUniqueName: 'cats',
      wikiPageId: 'wiki-1',
    });
  });

  it('hides when the current user lacks canUpdateChannel', () => {
    h.username.value = 'bob';
    const wrapper = mountButton({
      channel: channel({
        Admins: [{ username: 'alice' }],
        DefaultChannelRole: { canUpdateChannel: false },
      }),
    });

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('allows a default-role user with canUpdateChannel', () => {
    h.username.value = 'bob';
    const wrapper = mountButton({
      channel: channel({
        Admins: [{ username: 'alice' }],
        DefaultChannelRole: { canUpdateChannel: true },
      }),
    });

    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('shows a toast when the mutation fails', async () => {
    h.pinMutate.mockRejectedValue(new Error('denied'));
    const wrapper = mountButton();

    await wrapper.get('button').trigger('click');

    expect(h.error).toHaveBeenCalledWith(
      'Could not update wiki sidebar pins: denied'
    );
  });
});

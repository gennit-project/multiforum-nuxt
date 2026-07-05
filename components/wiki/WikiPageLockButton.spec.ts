import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';

import WikiPageLockButton from './WikiPageLockButton.vue';

const h = vi.hoisted(() => ({
  username: { value: 'alice' },
  success: vi.fn(),
  error: vi.fn(),
  lockMutate: vi.fn(async () => ({ data: { lockWikiPage: { id: 'wiki-1' } } })),
  unlockMutate: vi.fn(async () => ({ data: { unlockWikiPage: { id: 'wiki-1' } } })),
}));

vi.mock('@/composables/useAuthState', () => ({
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
  Admins: [{ username: 'alice' }],
  ElevatedChannelRole: { canUpdateChannel: true },
  ...overrides,
});

const mountButton = (overrides: Record<string, unknown> = {}) =>
  mount(WikiPageLockButton, {
    props: {
      channel: channel(),
      wikiPage: { id: 'wiki-1', locked: false },
      ...overrides,
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.username.value = 'alice';
  h.lockMutate.mockResolvedValue({ data: { lockWikiPage: { id: 'wiki-1' } } });
  h.unlockMutate.mockResolvedValue({ data: { unlockWikiPage: { id: 'wiki-1' } } });
  Object.defineProperty(window, 'prompt', {
    value: vi.fn(() => 'Settled canon'),
    configurable: true,
  });
  mockedUseMutation
    .mockReturnValueOnce({ mutate: h.lockMutate, loading: ref(false) })
    .mockReturnValueOnce({ mutate: h.unlockMutate, loading: ref(false) });
});

describe('WikiPageLockButton', () => {
  it('locks an unlocked wiki page with the provided reason', async () => {
    const wrapper = mountButton();

    await wrapper.get('button').trigger('click');

    expect(h.lockMutate).toHaveBeenCalledWith({
      wikiPageId: 'wiki-1',
      reason: 'Settled canon',
    });
  });

  it('unlocks a locked wiki page', async () => {
    const wrapper = mountButton({
      wikiPage: { id: 'wiki-1', locked: true },
    });

    await wrapper.get('button').trigger('click');

    expect(h.unlockMutate).toHaveBeenCalledWith({ wikiPageId: 'wiki-1' });
  });

  it('hides for non-owners', () => {
    h.username.value = 'bob';
    const wrapper = mountButton();

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('does not lock when the reason prompt is empty', async () => {
    vi.mocked(window.prompt).mockReturnValue('');
    const wrapper = mountButton();

    await wrapper.get('button').trigger('click');

    expect(h.lockMutate).not.toHaveBeenCalled();
  });

  it('shows a toast when the mutation fails', async () => {
    h.lockMutate.mockRejectedValue(new Error('denied'));
    const wrapper = mountButton();

    await wrapper.get('button').trigger('click');

    expect(h.error).toHaveBeenCalledWith(
      'Could not update wiki page lock: denied'
    );
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

// Routed useMutation mock: each useMutation(<gql>) call is matched by operation
// name so we can assert WHICH image mutation the submit flow fires and with what
// variables (the existing BrokenRulesModal.spec uses a single generic mock and
// only covers titles/rule-toggling).
const h = vi.hoisted(() => ({
  reportImage: vi.fn(),
  archiveImage: vi.fn(),
  generic: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (fn: any) => {
    const source = fn?.loc?.source?.body || '';
    let mutate = h.generic;
    if (source.includes('reportImage')) mutate = h.reportImage;
    else if (source.includes('archiveImage')) mutate = h.archiveImage;
    return {
      mutate,
      loading: false,
      error: undefined,
      onDone: vi.fn((cb) => cb),
    };
  },
  useLazyQuery: vi.fn(() => ({
    load: vi.fn(),
    loading: false,
    error: undefined,
    result: { value: { data: {} } },
  })),
  useQuery: vi.fn(() => ({
    loading: false,
    error: undefined,
    result: { value: {} },
  })),
  useApolloClient: vi.fn(() => ({
    client: { cache: { evict: vi.fn(), gc: vi.fn() }, refetchQueries: vi.fn() },
  })),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'test-forum' } }),
}));

vi.mock('luxon', () => {
  // A self-referential, fully chainable DateTime stub so any chain
  // (now().plus().set().startOf()...) resolves to a stable ISO string.
  const dt: any = {
    plus: () => dt,
    minus: () => dt,
    set: () => dt,
    startOf: () => dt,
    endOf: () => dt,
    toISO: () => '2024-04-29T12:00:00Z',
    toFormat: () => '2024-04-29',
  };
  return {
    DateTime: {
      now: () => dt,
      local: () => dt,
      fromISO: () => dt,
      fromJSDate: () => dt,
    },
  };
});

describe('BrokenRulesModal image report/archive wiring', () => {
  beforeEach(() => {
    h.reportImage.mockReset().mockResolvedValue({ data: { reportImage: { id: 'issue-1' } } });
    h.archiveImage.mockReset().mockResolvedValue({ data: { archiveImage: { id: 'issue-1' } } });
    h.generic.mockReset().mockResolvedValue({ data: {} });
  });

  const mountModal = async (props = {}) => {
    const BrokenRulesModal = (
      await import('@/components/mod/BrokenRulesModal.vue')
    ).default;
    return mount(BrokenRulesModal, {
      props: { open: true, discussionId: '', ...props },
      shallow: true,
    });
  };

  it('reports an image via reportImage with the selected rules and channel', async () => {
    const wrapper = await mountModal({ imageId: 'img-1' });
    (wrapper.vm as any).toggleForumRuleSelection('No NSFW');

    await (wrapper.vm as any).submit();

    expect(h.reportImage).toHaveBeenCalledWith(
      expect.objectContaining({
        imageId: 'img-1',
        selectedForumRules: ['No NSFW'],
        channelUniqueName: 'test-forum',
      })
    );
  });

  it('does not archive when only reporting', async () => {
    const wrapper = await mountModal({ imageId: 'img-1' });

    await (wrapper.vm as any).submit();

    expect(h.archiveImage).not.toHaveBeenCalled();
  });

  it('archives an image via archiveImage when archiveAfterReporting is set', async () => {
    const wrapper = await mountModal({
      imageId: 'img-1',
      archiveAfterReporting: true,
    });
    (wrapper.vm as any).toggleServerRuleSelection('Server Rule 1');

    await (wrapper.vm as any).submit();

    expect(h.archiveImage).toHaveBeenCalledWith(
      expect.objectContaining({
        imageId: 'img-1',
        selectedServerRules: ['Server Rule 1'],
        channelUniqueName: 'test-forum',
      })
    );
  });

  it('honors channelUniqueNameOverride for the reported image', async () => {
    const wrapper = await mountModal({
      imageId: 'img-1',
      channelUniqueNameOverride: 'cats',
    });

    await (wrapper.vm as any).submit();

    expect(h.reportImage).toHaveBeenCalledWith(
      expect.objectContaining({ imageId: 'img-1', channelUniqueName: 'cats' })
    );
  });
});

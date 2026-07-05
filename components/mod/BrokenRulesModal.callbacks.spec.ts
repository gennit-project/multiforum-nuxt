import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

// Routes each useMutation(<gql>) call to a per-operation tracker (matched on the
// operation field name in the gql source body) and — unlike the existing specs —
// captures the onDone + update callbacks so they can be fired/invoked directly.
type Tracker = {
  mutate: ReturnType<typeof vi.fn>;
  onDoneCb: (() => void) | null;
  update: ((cache: unknown) => void) | null;
};

const NAMES = [
  'reportDiscussion',
  'reportEvent',
  'reportComment',
  'reportImage',
  'reportWikiEdit',
  'archiveDiscussion',
  'archiveEvent',
  'archiveComment',
  'archiveImage',
  'suspendUser',
];

const ops = new Map<string, Tracker>();
const refetchQueries = vi.fn();

const trackerFor = (name: string): Tracker => {
  if (!ops.has(name)) {
    ops.set(name, {
      mutate: vi.fn().mockResolvedValue({ data: {} }),
      onDoneCb: null,
      update: null,
    });
  }
  return ops.get(name)!;
};

const detect = (src: string) => NAMES.find((n) => src.includes(n)) || 'generic';

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (doc: { loc?: { source?: { body?: string } } }, options?: { update?: (cache: unknown) => void }) => {
    const name = detect(doc?.loc?.source?.body || '');
    const t = trackerFor(name);
    if (options?.update) t.update = options.update;
    return {
      mutate: t.mutate,
      loading: false,
      error: undefined,
      onDone: (cb: () => void) => {
        t.onDoneCb = cb;
      },
    };
  },
  useQuery: () => ({ loading: false, error: undefined, result: { value: {} } }),
  useApolloClient: () => ({ client: { refetchQueries } }),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'test-forum' } }),
}));

const mountModal = async (props: Record<string, unknown> = {}) => {
  const BrokenRulesModal = (await import('./BrokenRulesModal.vue')).default;
  return mount(BrokenRulesModal, {
    props: { open: true, discussionId: '', ...props },
    shallow: true,
  });
};

const fakeCache = () => ({
  modify: vi.fn(({ fields }: { fields: Record<string, () => unknown> }) =>
    Object.values(fields).forEach((fn) => fn())
  ),
  identify: vi.fn(() => 'cache-id'),
  writeQuery: vi.fn(),
});

beforeEach(() => {
  ops.clear();
  refetchQueries.mockClear();
});

describe('BrokenRulesModal — report onDone', () => {
  it.each([
    ['discussionId', 'reportDiscussion'],
    ['eventId', 'reportEvent'],
    ['commentId', 'reportComment'],
    ['imageId', 'reportImage'],
    ['wikiPageId', 'reportWikiEdit'],
  ])('emits reportSubmittedSuccessfully on %s report done', async (prop, op) => {
    const wrapper = await mountModal({ [prop]: 'x1' });
    ops.get(op)!.onDoneCb!();

    expect(wrapper.emitted('reportSubmittedSuccessfully')).toBeTruthy();
  });
});

describe('BrokenRulesModal — archive onDone', () => {
  it.each([
    ['discussionId', 'archiveDiscussion'],
    ['eventId', 'archiveEvent'],
    ['commentId', 'archiveComment'],
    ['imageId', 'archiveImage'],
  ])('emits reportedAndArchivedSuccessfully on %s archive done', async (prop, op) => {
    const wrapper = await mountModal({ [prop]: 'x1', archiveAfterReporting: true });
    ops.get(op)!.onDoneCb!();

    expect(wrapper.emitted('reportedAndArchivedSuccessfully')).toBeTruthy();
  });

  it('refetches the issue query after an archive', async () => {
    await mountModal({ discussionId: 'd1', archiveAfterReporting: true });
    ops.get('archiveDiscussion')!.onDoneCb!();

    expect(refetchQueries).toHaveBeenCalledTimes(1);
  });
});

describe('BrokenRulesModal — suspend onDone', () => {
  it('emits suspended-user-successfully when the suspend mutation completes', async () => {
    const wrapper = await mountModal({
      discussionId: 'd1',
      suspendUserEnabled: true,
    });
    ops.get('suspendUser')!.onDoneCb!();

    expect(wrapper.emitted('suspended-user-successfully')).toBeTruthy();
  });
});

describe('BrokenRulesModal — cache update callbacks', () => {
  it('marks the discussion channel archived in the cache', async () => {
    await mountModal({ discussionId: 'd1', discussionChannelId: 'dc1' });
    const cache = fakeCache();
    ops.get('archiveDiscussion')!.update!(cache);

    expect(cache.modify).toHaveBeenCalledTimes(1);
  });

  it('skips the discussion cache update when no channel id is provided', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await mountModal({ discussionId: 'd1' });
    const cache = fakeCache();
    ops.get('archiveDiscussion')!.update!(cache);
    errorSpy.mockRestore();

    expect(cache.modify).not.toHaveBeenCalled();
  });

  it('marks the event channel archived in the cache', async () => {
    await mountModal({ eventId: 'e1', eventChannelId: 'ec1' });
    const cache = fakeCache();
    ops.get('archiveEvent')!.update!(cache);

    expect(cache.modify).toHaveBeenCalledTimes(1);
  });

  it('skips the event cache update when no channel id is provided', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await mountModal({ eventId: 'e1' });
    const cache = fakeCache();
    ops.get('archiveEvent')!.update!(cache);
    errorSpy.mockRestore();

    expect(cache.modify).not.toHaveBeenCalled();
  });

  it('marks the comment archived in the cache', async () => {
    await mountModal({ commentId: 'c1' });
    const cache = fakeCache();
    ops.get('archiveComment')!.update!(cache);

    expect(cache.modify).toHaveBeenCalledTimes(1);
  });

  it('marks the image archived in the cache', async () => {
    await mountModal({ imageId: 'i1' });
    const cache = fakeCache();
    ops.get('archiveImage')!.update!(cache);

    expect(cache.modify).toHaveBeenCalledTimes(1);
  });

  it('writes the suspended-poster flag to the cache on suspend', async () => {
    await mountModal({ discussionId: 'd1', suspendUserEnabled: true, issueId: 'iss-1' });
    const cache = fakeCache();
    ops.get('suspendUser')!.update!(cache);

    expect(cache.writeQuery).toHaveBeenCalledTimes(1);
  });
});

describe('BrokenRulesModal — submit dispatch', () => {
  it('does nothing when no content id is provided', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = await mountModal();
    await (wrapper.vm as unknown as { submit: () => Promise<void> }).submit();
    errorSpy.mockRestore();

    expect(ops.get('reportDiscussion')!.mutate).not.toHaveBeenCalled();
  });

  it('reports a wiki edit when a wiki page id is provided', async () => {
    const wrapper = await mountModal({ wikiPageId: 'w1', wikiRevisionId: 'r1' });
    await (wrapper.vm as unknown as { submit: () => Promise<void> }).submit();

    expect(ops.get('reportWikiEdit')!.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ wikiPageId: 'w1', wikiRevisionId: 'r1' })
    );
  });

  it.each([
    ['discussionId', 'reportDiscussion'],
    ['eventId', 'reportEvent'],
    ['commentId', 'reportComment'],
    ['imageId', 'reportImage'],
  ])('reports the %s in the standard report flow', async (prop, op) => {
    const wrapper = await mountModal({ [prop]: 'x1' });
    await (wrapper.vm as unknown as { submit: () => Promise<void> }).submit();

    expect(ops.get(op)!.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ [prop]: 'x1' })
    );
  });

  it.each([
    ['discussionId', 'archiveDiscussion'],
    ['eventId', 'archiveEvent'],
    ['commentId', 'archiveComment'],
    ['imageId', 'archiveImage'],
  ])('archives the %s in the archive-after-reporting flow', async (prop, op) => {
    const wrapper = await mountModal({ [prop]: 'x1', archiveAfterReporting: true });
    await (wrapper.vm as unknown as { submit: () => Promise<void> }).submit();

    expect(ops.get(op)!.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ [prop]: 'x1' })
    );
  });
});

describe('BrokenRulesModal — content computeds', () => {
  it.each([
    ['commentId', 'comment'],
    ['discussionId', 'discussion'],
    ['eventId', 'event'],
    ['imageId', 'image'],
    ['wikiPageId', 'wiki edit'],
  ])('resolves contentType to %s', async (prop, expected) => {
    const wrapper = await mountModal({ [prop]: 'x1' });
    expect((wrapper.vm as unknown as { contentType: string }).contentType).toBe(
      expected
    );
  });

  it.each([
    ['commentId', 'comment'],
    ['eventId', 'event'],
    ['imageId', 'image'],
    ['wikiPageId', 'wiki edit'],
    ['discussionId', 'discussion'],
  ])('builds the placeholder text for %s', async (prop, word) => {
    const wrapper = await mountModal({ [prop]: 'x1' });
    expect(
      (wrapper.vm as unknown as { modalPlaceholder: string }).modalPlaceholder
    ).toContain(word);
  });
});

describe('BrokenRulesModal — suspend flow', () => {
  type Vm = {
    submit: () => Promise<void>;
    suspensionLength: string;
  };

  beforeEach(() => {
    trackerFor('archiveDiscussion').mutate.mockResolvedValue({
      data: { archiveDiscussion: { id: 'issue-9' } },
    });
  });

  it('archives then suspends with a fixed-term suspension', async () => {
    const wrapper = await mountModal({
      discussionId: 'd1',
      discussionChannelId: 'dc1',
      suspendUserEnabled: true,
    });

    await (wrapper.vm as unknown as Vm).submit();

    expect(ops.get('suspendUser')!.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ issueID: 'issue-9', suspendIndefinitely: false })
    );
  });

  it('suspends for a month when the one_month length is selected', async () => {
    const wrapper = await mountModal({
      discussionId: 'd1',
      discussionChannelId: 'dc1',
      suspendUserEnabled: true,
    });
    (wrapper.vm as unknown as Vm).suspensionLength = 'one_month';

    await (wrapper.vm as unknown as Vm).submit();

    expect(ops.get('suspendUser')!.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ suspendIndefinitely: false })
    );
  });

  it.each([
    ['eventId', 'archiveEvent', 'eventChannelId'],
    ['commentId', 'archiveComment', ''],
    ['imageId', 'archiveImage', ''],
  ])('archives the %s then suspends the author', async (prop, archiveOp, channelProp) => {
    trackerFor(archiveOp).mutate.mockResolvedValue({
      data: { [archiveOp]: { id: 'issue-9' } },
    });
    const props: Record<string, unknown> = {
      [prop]: 'x1',
      suspendUserEnabled: true,
    };
    if (channelProp) props[channelProp] = 'chan-1';
    const wrapper = await mountModal(props);

    await (wrapper.vm as unknown as Vm).submit();

    expect(ops.get('suspendUser')!.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ issueID: 'issue-9' })
    );
  });

  it('suspends indefinitely when the indefinite length is selected', async () => {
    const wrapper = await mountModal({
      discussionId: 'd1',
      discussionChannelId: 'dc1',
      suspendUserEnabled: true,
    });
    (wrapper.vm as unknown as Vm).suspensionLength = 'indefinite';

    await (wrapper.vm as unknown as Vm).submit();

    expect(ops.get('suspendUser')!.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ suspendIndefinitely: true, suspendUntil: null })
    );
  });

  it('does not suspend when no suspension length is selected', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = await mountModal({
      discussionId: 'd1',
      discussionChannelId: 'dc1',
      suspendUserEnabled: true,
    });
    (wrapper.vm as unknown as Vm).suspensionLength = '';

    await (wrapper.vm as unknown as Vm).submit();
    errorSpy.mockRestore();

    expect(ops.get('suspendUser')!.mutate).not.toHaveBeenCalled();
  });

  it('does not suspend when the archive step returns no issue id', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    trackerFor('archiveDiscussion').mutate.mockResolvedValue({ data: {} });
    const wrapper = await mountModal({
      discussionId: 'd1',
      discussionChannelId: 'dc1',
      suspendUserEnabled: true,
    });

    await (wrapper.vm as unknown as Vm).submit();
    errorSpy.mockRestore();

    expect(ops.get('suspendUser')!.mutate).not.toHaveBeenCalled();
  });
});

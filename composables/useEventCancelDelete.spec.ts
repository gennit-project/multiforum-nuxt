import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { asMock, createMutationRouter } from '@/tests/utils/mockApollo';
import { useEventCancelDelete } from './useEventCancelDelete';

const pushSpy = vi.fn();
vi.mock('@vue/apollo-composable', () => ({ useMutation: vi.fn() }));
vi.mock('nuxt/app', () => ({ useRouter: () => ({ push: pushSpy }) }));

const router = createMutationRouter([
  'updateEventInSeries',
  'cancelEvent',
  'deleteEvent',
  'deleteEventInSeries',
]);

const setup = (opts: {
  eventId?: string;
  channelId?: string;
  isPartOfSeries?: boolean;
} = {}) => {
  const { eventId = 'e1', channelId = 'cats', isPartOfSeries = false } = opts;
  return useEventCancelDelete({
    eventId: ref(eventId),
    channelId: ref(channelId),
    isPartOfSeries: ref(isPartOfSeries),
  });
};

beforeEach(() => {
  router.reset();
  pushSpy.mockReset();
  asMock(useMutation).mockImplementation(router.useMutation);
});

describe('useEventCancelDelete — scope routing', () => {
  it('opens the plain delete confirm for a standalone event', () => {
    const s = setup({ isPartOfSeries: false });
    s.handleDeleteClick();
    expect([s.confirmDeleteIsOpen.value, s.showDeleteScopeModal.value]).toEqual([
      true,
      false,
    ]);
  });

  it('opens the delete scope modal for a series event', () => {
    const s = setup({ isPartOfSeries: true });
    s.handleDeleteClick();
    expect([s.showDeleteScopeModal.value, s.confirmDeleteIsOpen.value]).toEqual([
      true,
      false,
    ]);
  });

  it('opens the plain cancel confirm for a standalone event', () => {
    const s = setup({ isPartOfSeries: false });
    s.handleCancelClick();
    expect(s.confirmCancelIsOpen.value).toBe(true);
  });

  it('opens the cancel scope modal for a series event', () => {
    const s = setup({ isPartOfSeries: true });
    s.handleCancelClick();
    expect(s.showCancelScopeModal.value).toBe(true);
  });
});

describe('useEventCancelDelete — series confirm handlers', () => {
  it('deletes the chosen scope of the series', () => {
    const s = setup();
    s.handleDeleteScopeConfirm('thisEvent' as never);
    expect(router.get('deleteEventInSeries').mutate).toHaveBeenCalledWith({
      eventId: 'e1',
      scope: 'thisEvent',
    });
  });

  it('cancels the chosen scope of the series', () => {
    const s = setup();
    s.handleCancelScopeConfirm('allEvents' as never);
    expect(router.get('updateEventInSeries').mutate).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'e1', scope: 'allEvents' })
    );
  });
});

describe('useEventCancelDelete — post-action side effects', () => {
  it('navigates to the forum event list after a delete completes', () => {
    setup({ channelId: 'cats' });
    router.get('deleteEvent').fireDone();
    expect(pushSpy).toHaveBeenCalledWith({
      name: 'forums-forumId-events',
      params: { forumId: 'cats' },
    });
  });

  it('does not navigate after delete when there is no channel', () => {
    setup({ channelId: '' });
    router.get('deleteEvent').fireDone();
    expect(pushSpy).not.toHaveBeenCalled();
  });

  it('closes the cancel confirm after a cancel completes', () => {
    const s = setup();
    s.confirmCancelIsOpen.value = true;
    router.get('cancelEvent').fireDone();
    expect(s.confirmCancelIsOpen.value).toBe(false);
  });

  it('closes the cancel scope modal after an in-series cancel completes', () => {
    const s = setup({ isPartOfSeries: true });
    s.showCancelScopeModal.value = true;
    router.get('updateEventInSeries').fireDone();
    expect(s.showCancelScopeModal.value).toBe(false);
  });

  it('closes the delete scope modal and navigates after an in-series delete', () => {
    const s = setup({ isPartOfSeries: true, channelId: 'cats' });
    s.showDeleteScopeModal.value = true;
    router.get('deleteEventInSeries').fireDone();
    expect([s.showDeleteScopeModal.value, pushSpy.mock.calls.length]).toEqual([
      false,
      1,
    ]);
  });
});

describe('useEventCancelDelete — cache + combined state', () => {
  it('removes the deleted event from the cached events list', () => {
    setup({ eventId: 'e1' });
    let eventsFn: (refs: unknown[], h: unknown) => unknown[] = () => [];
    const cache = {
      modify: vi.fn((opts: any) => {
        eventsFn = opts.fields.events;
      }),
    };
    router.get('deleteEvent').update!(cache, {});
    const remaining = eventsFn([{ __ref: 'e1' }, { __ref: 'e2' }], {
      readField: (_f: string, r: { __ref: string }) => r.__ref,
    });
    expect(remaining).toEqual([{ __ref: 'e2' }]);
  });

  it('surfaces either delete error via combinedDeleteError', () => {
    const s = setup();
    router.get('deleteEventInSeries').error.value = new Error('series boom');
    expect(s.combinedDeleteError.value?.message).toBe('series boom');
  });

  it('reports combinedCancelLoading when either cancel mutation is loading', () => {
    const s = setup();
    router.get('updateEventInSeries').loading.value = true;
    expect(s.combinedCancelLoading.value).toBe(true);
  });
});

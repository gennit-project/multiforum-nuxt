import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import { mount } from '@vue/test-utils';
import EventHeader from './EventHeader.vue';

const routerPush = vi.fn();
const routerResolve = vi.fn(() => ({ href: '/forums/cats/events/event-1' }));
const modProfileName = ref('mod-alice');
const feedbackEnabledFlag = ref(true);
const clipboardWriteText = vi.fn().mockResolvedValue(undefined);

// Captured per useMutation call, in declaration order:
// 0 DELETE_EVENT, 1 CANCEL_EVENT, 2 UPDATE_EVENT_IN_SERIES,
// 3 DELETE_EVENT_IN_SERIES, 4 ADD_FEEDBACK_COMMENT_TO_EVENT.
let mutateSpies: ReturnType<typeof vi.fn>[] = [];
let onDoneCallbacks: (() => void)[] = [];
let mutationOptions: ({ update?: (cache: unknown) => void } | undefined)[] = [];
let useMutationCall = 0;

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    name: 'forums-forumId-events-eventId',
    params: { forumId: 'cats', eventId: 'event-1' },
  }),
  useRouter: () => ({ push: routerPush, resolve: routerResolve }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: computed(() => ({
      channels: [{ feedbackEnabled: feedbackEnabledFlag.value }],
      serverConfigs: [{}],
      issues: [{ issueNumber: 42 }],
    })),
  }),
  useMutation: (_doc: unknown, options?: unknown) => {
    const index = useMutationCall++;
    const mutate = vi.fn().mockResolvedValue(undefined);
    mutateSpies[index] = mutate;
    mutationOptions[index] = options as { update?: (cache: unknown) => void };
    return {
      mutate,
      loading: ref(false),
      error: ref(null),
      onDone: (cb: () => void) => {
        onDoneCallbacks[index] = cb;
      },
    };
  },
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('viewer'),
  useModProfileName: () => modProfileName,
  setUsername: vi.fn(),
  setModProfileName: vi.fn(),
}));

vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({
    serverAdminUsernames: computed(() => []),
    serverModUsernames: computed(() => []),
    serverModProfileNames: computed(() => []),
  }),
}));

vi.mock('@/composables/useForumRoleMembership', () => ({
  useForumRoleMembership: () => ({
    forumAdminUsernames: computed(() => []),
    forumModUsernames: computed(() => []),
    forumModProfileNames: computed(() => []),
  }),
}));

vi.mock('@/composables/useResolvedModPermissions', () => ({
  useResolvedModPermissions: () => ({
    userPermissions: computed(() => ({
      canReport: true,
      canGiveFeedback: true,
      canHideEvent: true,
      canSuspendUser: true,
      isChannelOwner: true,
      isElevatedMod: true,
      isSuspendedMod: false,
      isSuspendedUser: false,
    })),
  }),
}));

vi.mock('@/composables/useModerationOutcomeUI', () => ({
  useModerationOutcomeUI: () => ({
    showReportModal: ref(false),
    showArchiveModal: ref(false),
    showUnarchiveModal: ref(false),
    showArchiveAndSuspendModal: ref(false),
    showSuccessfullyArchived: ref(false),
    showSuccessfullyUnarchived: ref(false),
    showSuccessfullyArchivedAndSuspended: ref(false),
    showSuccessfullyReported: ref(false),
    openReportModal: vi.fn(),
    openArchiveModal: vi.fn(),
    openUnarchiveModal: vi.fn(),
    openArchiveAndSuspendModal: vi.fn(),
    closeReportModal: vi.fn(),
    closeArchiveModal: vi.fn(),
    closeUnarchiveModal: vi.fn(),
    closeArchiveAndSuspendModal: vi.fn(),
    handleReportedSuccessfully: vi.fn(),
    handleArchivedSuccessfully: vi.fn(),
    handleUnarchivedSuccessfully: vi.fn(),
    handleArchivedAndSuspendedSuccessfully: vi.fn(),
    dismissReportedNotification: vi.fn(),
    dismissArchivedNotification: vi.fn(),
    dismissUnarchivedNotification: vi.fn(),
    dismissArchivedAndSuspendedNotification: vi.fn(),
  }),
}));

const baseEvent = () => ({
  id: 'event-1',
  title: 'Cat meetup',
  startTime: '2030-01-01T12:00:00.000Z',
  endTime: '2030-01-01T14:00:00.000Z',
  isAllDay: false,
  canceled: false,
  address: '123 Main St',
  Poster: {
    username: 'alice',
    displayName: 'Alice',
    profilePicURL: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    commentKarma: 0,
    discussionKarma: 0,
  },
  EventChannels: [{ channelUniqueName: 'cats' }],
});

const buildWrapper = (eventData: Record<string, unknown> = baseEvent()) =>
  mount(EventHeader, {
    props: { eventData, showMenuButtons: true, eventChannelId: 'channel-1' },
    global: {
      stubs: {
        CalendarIcon: { template: '<span />' },
        LinkIcon: { template: '<span />' },
        LocationIcon: { template: '<span />' },
        ClipboardIcon: { template: '<span />' },
        EllipsisHorizontal: { template: '<span />' },
        UsernameWithTooltip: { template: '<span />' },
        MarkdownPreview: { template: '<div />' },
        InfoBanner: { template: '<div />' },
        ErrorBanner: { template: '<div />' },
        Notification: { template: '<div />' },
        UnarchiveModal: { template: '<div />' },
        BrokenRulesModal: { template: '<div />' },
        NuxtLink: { template: '<a><slot /></a>' },
        ClientOnly: { template: '<div><slot /></div>' },
        MenuButton: {
          template:
            '<button data-testid="event-menu-button"><slot /></button>',
          props: ['items'],
        },
        WarningModal: {
          template: '<div data-testid="warning-modal" :data-open="open" />',
          props: ['open', 'loading', 'error'],
        },
        EditScopeModal: {
          template: '<div data-testid="scope-modal" :data-open="isOpen" />',
          props: ['isOpen', 'eventTitle'],
        },
        GenericFeedbackFormModal: {
          template: '<div data-testid="feedback-modal" :data-open="open" />',
          props: ['open', 'loading', 'error'],
        },
      },
    },
  });

const menu = (wrapper: ReturnType<typeof buildWrapper>) =>
  wrapper.findComponent('[data-testid="event-menu-button"]');

beforeEach(() => {
  routerPush.mockReset();
  routerResolve.mockClear();
  clipboardWriteText.mockClear().mockResolvedValue(undefined);
  modProfileName.value = 'mod-alice';
  feedbackEnabledFlag.value = true;
  mutateSpies = [];
  onDoneCallbacks = [];
  mutationOptions = [];
  useMutationCall = 0;
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: clipboardWriteText },
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EventHeader — copy actions', () => {
  it('copies the event permalink to the clipboard', async () => {
    const wrapper = buildWrapper();
    await menu(wrapper).vm.$emit('copy-link');

    expect(clipboardWriteText).toHaveBeenCalledTimes(1);
  });

  it('copies the event address to the clipboard', async () => {
    const wrapper = buildWrapper();
    await wrapper
      .find('button[aria-label="Copy address to clipboard"]')
      .trigger('click');

    expect(clipboardWriteText).toHaveBeenCalledWith('123 Main St');
  });

  it('shows the copied confirmation after copying the address', async () => {
    const wrapper = buildWrapper();
    await wrapper
      .find('button[aria-label="Copy address to clipboard"]')
      .trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Copied!');
  });
});

describe('EventHeader — cancel flow', () => {
  it('opens the cancel confirmation for a standalone event', async () => {
    const wrapper = buildWrapper();
    await menu(wrapper).vm.$emit('handle-cancel');

    expect(
      wrapper.findAll('[data-testid="warning-modal"]').length
    ).toBeGreaterThan(1);
  });

  it('opens the cancel scope modal for a series event', async () => {
    const wrapper = buildWrapper({ ...baseEvent(), EventSeries: { id: 's1' } });
    await menu(wrapper).vm.$emit('handle-cancel');
    const scopeModals = wrapper.findAll('[data-testid="scope-modal"]');

    expect(scopeModals[0]!.attributes('data-open')).toBe('true');
  });

  it('cancels a series event when a scope is confirmed', async () => {
    const wrapper = buildWrapper({ ...baseEvent(), EventSeries: { id: 's1' } });
    const scopeModal = wrapper.findAllComponents('[data-testid="scope-modal"]')[0]!;
    await scopeModal.vm.$emit('confirm', 'thisEvent');

    expect(mutateSpies[2]).toHaveBeenCalledTimes(1);
  });
});

describe('EventHeader — delete flow', () => {
  it('opens the delete confirmation for a standalone event', async () => {
    const wrapper = buildWrapper();
    await menu(wrapper).vm.$emit('handle-delete');

    expect(
      wrapper.find('[data-testid="warning-modal"]').attributes('data-open')
    ).toBe('true');
  });

  it('opens the delete scope modal for a series event', async () => {
    const wrapper = buildWrapper({ ...baseEvent(), EventSeries: { id: 's1' } });
    await menu(wrapper).vm.$emit('handle-delete');
    const scopeModals = wrapper.findAll('[data-testid="scope-modal"]');

    expect(scopeModals[1]!.attributes('data-open')).toBe('true');
  });

  it('deletes a series event when a scope is confirmed', async () => {
    const wrapper = buildWrapper({ ...baseEvent(), EventSeries: { id: 's1' } });
    const scopeModal = wrapper.findAllComponents('[data-testid="scope-modal"]')[1]!;
    await scopeModal.vm.$emit('confirm', 'thisEvent');

    expect(mutateSpies[3]).toHaveBeenCalledWith({
      eventId: 'event-1',
      scope: 'thisEvent',
    });
  });

  it('deletes the event when the confirmation is accepted', async () => {
    const wrapper = buildWrapper();
    const deleteModal = wrapper.findAllComponents(
      '[data-testid="warning-modal"]'
    )[0]!;
    await deleteModal.vm.$emit('primary-button-click');

    expect(mutateSpies[0]).toHaveBeenCalledTimes(1);
  });

  it('navigates to the events list after a successful delete', async () => {
    buildWrapper();
    onDoneCallbacks[0]!();

    expect(routerPush).toHaveBeenCalledWith({
      name: 'forums-forumId-events',
      params: { forumId: 'cats' },
    });
  });

  it('removes the event from the cache on delete', () => {
    buildWrapper();
    const modify = vi.fn();
    mutationOptions[0]!.update!({ modify } as never);

    expect(modify).toHaveBeenCalledTimes(1);
  });
});

describe('EventHeader — feedback flow', () => {
  it('navigates to the feedback page', async () => {
    const wrapper = buildWrapper();
    await menu(wrapper).vm.$emit('handle-view-feedback');

    expect(routerPush).toHaveBeenCalledWith({
      name: 'forums-forumId-events-feedback-eventId',
      params: { eventId: 'event-1', forumId: 'cats' },
    });
  });

  it('submits feedback when text and a mod profile are present', async () => {
    const wrapper = buildWrapper();
    const feedbackModal = wrapper.findComponent('[data-testid="feedback-modal"]');
    await feedbackModal.vm.$emit('update-feedback', 'Great event');
    await feedbackModal.vm.$emit('primary-button-click');

    expect(mutateSpies[4]).toHaveBeenCalledTimes(1);
  });

  it('does not submit feedback without any text', async () => {
    const wrapper = buildWrapper();
    const feedbackModal = wrapper.findComponent('[data-testid="feedback-modal"]');
    await feedbackModal.vm.$emit('primary-button-click');

    expect(mutateSpies[4]).not.toHaveBeenCalled();
  });

  it('does not submit feedback without a mod profile name', async () => {
    modProfileName.value = '';
    const wrapper = buildWrapper();
    const feedbackModal = wrapper.findComponent('[data-testid="feedback-modal"]');
    await feedbackModal.vm.$emit('update-feedback', 'Great event');
    await feedbackModal.vm.$emit('primary-button-click');

    expect(mutateSpies[4]).not.toHaveBeenCalled();
  });

  it('shows the success notice after feedback is recorded', async () => {
    const wrapper = buildWrapper();
    onDoneCallbacks[4]!();
    await wrapper.vm.$nextTick();
    const feedbackModal = wrapper.findComponent('[data-testid="feedback-modal"]');

    expect(feedbackModal.attributes('data-open')).toBe('false');
  });
});

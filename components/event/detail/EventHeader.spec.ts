import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import { mount } from '@vue/test-utils';
import EventHeader from './EventHeader.vue';

const channelFeedbackEnabled = ref(true);
const routerPush = vi.fn();

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    name: 'forums-forumId-events-eventId',
    params: {
      forumId: 'cats',
      eventId: 'event-1',
    },
  }),
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: computed(() => ({
      channels: [
        {
          feedbackEnabled: channelFeedbackEnabled.value,
        },
      ],
      serverConfigs: [{}],
      issues: [],
    })),
  }),
  useMutation: () => ({
    mutate: vi.fn(),
    loading: ref(false),
    error: ref(null),
    onDone: vi.fn(),
  }),
}));

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return {
    useUsername: () => ref('viewer'),
    useModProfileName: () => ref('mod-alice'),
    setUsername: vi.fn(),
    setModProfileName: vi.fn(),
  };
});

vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({
    serverAdminUsernames: computed(() => []),
  }),
}));

vi.mock('@/composables/useResolvedModPermissions', () => ({
  useResolvedModPermissions: () => ({
    userPermissions: computed(() => ({
      canReport: true,
      canGiveFeedback: true,
      canHideEvent: false,
      canSuspendUser: false,
      isChannelOwner: false,
      isElevatedMod: false,
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

describe('EventHeader', () => {
  beforeEach(() => {
    channelFeedbackEnabled.value = true;
    routerPush.mockReset();
  });

  const buildWrapper = () =>
    mount(EventHeader, {
      props: {
        eventData: {
          id: 'event-1',
          title: 'Cat meetup',
          startTime: '2030-01-01T12:00:00.000Z',
          endTime: '2030-01-01T14:00:00.000Z',
          isAllDay: false,
          canceled: false,
          Poster: {
            username: 'alice',
            displayName: 'Alice',
            profilePicURL: '',
            createdAt: '2024-01-01T00:00:00.000Z',
            commentKarma: 0,
            discussionKarma: 0,
          },
          EventChannels: [
            {
              channelUniqueName: 'cats',
            },
          ],
        },
        showMenuButtons: true,
      },
      global: {
        stubs: {
          CalendarIcon: { template: '<span />' },
          LinkIcon: { template: '<span />' },
          LocationIcon: { template: '<span />' },
          ClipboardIcon: { template: '<span />' },
          EllipsisHorizontal: { template: '<span />' },
          EditScopeModal: { template: '<div />' },
          WarningModal: { template: '<div />' },
          ErrorBanner: { template: '<div />' },
          UsernameWithTooltip: { template: '<span />' },
          InfoBanner: { template: '<div />' },
          UnarchiveModal: { template: '<div />' },
          BrokenRulesModal: { template: '<div />' },
          Notification: { template: '<div />' },
          NuxtLink: { template: '<a><slot /></a>' },
          MarkdownPreview: { template: '<div />' },
          ClientOnly: { template: '<div><slot /></div>' },
          MenuButton: {
            template:
              '<button data-testid="event-menu-button" @click="$emit(\'handle-feedback\')"><slot /></button>',
            props: ['items'],
          },
          GenericFeedbackFormModal: {
            template: '<div v-if="open" data-testid="feedback-modal" />',
            props: ['open'],
          },
        },
      },
    });

  it.each([
    { feedbackEnabled: true, expectedModalCount: 1 },
    { feedbackEnabled: false, expectedModalCount: 0 },
  ])(
    'renders $expectedModalCount feedback modal when feedbackEnabled is $feedbackEnabled',
    async ({ feedbackEnabled, expectedModalCount }) => {
      channelFeedbackEnabled.value = feedbackEnabled;
      const wrapper = buildWrapper();

      await wrapper.find('[data-testid="event-menu-button"]').trigger('click');

      expect(wrapper.findAll('[data-testid="feedback-modal"]')).toHaveLength(
        expectedModalCount
      );
    }
  );
});

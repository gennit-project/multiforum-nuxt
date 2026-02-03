<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { PropType } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import type { Event } from '@/__generated__/graphql';
import {
  CANCEL_EVENT,
  DELETE_EVENT,
  ADD_FEEDBACK_COMMENT_TO_EVENT,
} from '@/graphQLData/event/mutations';
import CalendarIcon from '@/components/icons/CalendarIcon.vue';
import LinkIcon from '@/components/icons/LinkIcon.vue';
import LocationIcon from '@/components/icons/LocationIcon.vue';
import ClipboardIcon from '@/components/icons/ClipboardIcon.vue';
import Notification from '@/components/NotificationComponent.vue';
import { DateTime } from 'luxon';
import EllipsisHorizontal from '@/components/icons/EllipsisHorizontal.vue';
import WarningModal from '@/components/WarningModal.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import { getDuration } from '@/utils';
import { getAllPermissions } from '@/utils/permissionUtils';
import { getEventHeaderMenuItems } from '@/utils/headerPermissionUtils';
import GenericFeedbackFormModal from '@/components/GenericFeedbackFormModal.vue';
import BrokenRulesModal from '@/components/mod/BrokenRulesModal.vue';
import { modProfileNameVar, usernameVar } from '@/cache';
import { useRoute, useRouter } from 'nuxt/app';
import InfoBanner from '@/components/InfoBanner.vue';
import UnarchiveModal from '@/components/mod/UnarchiveModal.vue';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { USER_IS_MOD_OR_OWNER_IN_CHANNEL } from '@/graphQLData/user/queries';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { config } from '@/config';
import { CHECK_EVENT_ISSUE_EXISTENCE } from '@/graphQLData/issue/queries';

const props = defineProps({
  eventData: {
    type: Object as PropType<Event>,
    required: true,
  },
  showMenuButtons: {
    type: Boolean,
    default: true,
  },
  eventIsArchived: {
    type: Boolean,
    default: false,
  },
  eventChannelId: {
    type: String,
    default: '',
  },
});

defineEmits(['archived-successfully']);

const route = useRoute();
const router = useRouter();

const showCopiedLinkNotification = ref(false);
const showFeedbackFormModal = ref(false);
const showFeedbackSubmittedSuccessfully = ref(false);
const confirmDeleteIsOpen = ref(false);
const confirmCancelIsOpen = ref(false);
const showArchiveAndSuspendModal = ref(false);

const showReportEventModal = ref(false);
const showArchiveModal = ref(false);
const showUnarchiveModal = ref(false);
const showSuccessfullyArchived = ref(false);
const showSuccessfullyUnarchived = ref(false);
const showSuccessfullySuspended = ref(false);
const showSuccessfullyArchivedAndSuspended = ref(false);
const showSuccessfullyReported = ref(false);

const eventId = computed(() => {
  return (
    props.eventData?.id ||
    (typeof route.params.eventId === 'string' ? route.params.eventId : '')
  );
});

const channelId = computed(() => {
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return props.eventData?.EventChannels?.[0]?.channelUniqueName || '';
});

// Query the channel data to get roles
const { result: getChannelResult } = useQuery(
  GET_CHANNEL,
  {
    uniqueName: channelId.value,
    // Using luxon, round down to the nearest hour
    now: DateTime.local().startOf('hour').toISO(),
  },
  {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    enabled: computed(() => !!channelId.value),
  }
);

// Query server config to get default roles
const { result: getServerResult } = useQuery(
  GET_SERVER_CONFIG,
  {
    serverName: config.serverName,
  },
  {
    fetchPolicy: 'cache-first',
  }
);

// Get the standard and elevated mod roles from the channel or server default
const standardModRole = computed(() => {
  // If the channel has a Default Mod Role, return that
  if (getChannelResult.value?.channels[0]?.DefaultModRole) {
    return getChannelResult.value?.channels[0]?.DefaultModRole;
  }
  // Otherwise, return the default mod role from the server config
  if (getServerResult.value?.serverConfigs[0]?.DefaultModRole) {
    return getServerResult.value?.serverConfigs[0]?.DefaultModRole;
  }
  return null;
});

const elevatedModRole = computed(() => {
  // If the channel has a Default Elevated Mod Role, return that
  if (getChannelResult.value?.channels[0]?.ElevatedModRole) {
    return getChannelResult.value?.channels[0]?.ElevatedModRole;
  }
  // Otherwise, return the default elevated mod role from server config
  if (getServerResult.value?.serverConfigs[0]?.DefaultElevatedModRole) {
    return getServerResult.value?.serverConfigs[0]?.DefaultElevatedModRole;
  }
  return null;
});

// Query user's permissions in the channel
const { result: getPermissionResult } = useQuery(
  USER_IS_MOD_OR_OWNER_IN_CHANNEL,
  {
    modDisplayName: modProfileNameVar.value,
    username: usernameVar.value,
    channelUniqueName: channelId.value || '',
  },
  {
    enabled: computed(
      () =>
        !!modProfileNameVar.value && !!usernameVar.value && !!channelId.value
    ),
    fetchPolicy: 'cache-first',
  }
);

const { result: getEventIssueResult } = useQuery(
  CHECK_EVENT_ISSUE_EXISTENCE,
  () => ({
    eventId: eventId.value,
    channelUniqueName: channelId.value,
  }),
  {
    fetchPolicy: 'cache-first',
    enabled: computed(() => !!eventId.value && !!channelId.value),
  }
);

const relatedIssueNumber = computed(() => {
  return getEventIssueResult.value?.issues?.[0]?.issueNumber ?? null;
});

const relatedIssueLink = computed(() => {
  if (relatedIssueNumber.value == null || !channelId.value) {
    return null;
  }

  return {
    name: 'forums-forumId-issues-issueNumber',
    params: {
      forumId: channelId.value,
      issueNumber: relatedIssueNumber.value,
    },
  };
});

// Get permission data from the query result
const permissionData = computed(() => {
  if (getPermissionResult.value?.channels?.[0]) {
    return getPermissionResult.value.channels[0];
  }
  return null;
});

// Get all permissions for the current user using our utility function
const userPermissions = computed(() => {
  return getAllPermissions({
    permissionData: permissionData.value,
    standardModRole: standardModRole.value,
    elevatedModRole: elevatedModRole.value,
    username: usernameVar.value,
    modProfileName: modProfileNameVar.value,
  });
});

const permalinkObject = computed(() => {
  if (!eventId.value) return {};
  return {
    name: 'forums-forumId-events-eventId',
    params: {
      eventId: eventId.value,
      forumId: channelId.value,
    },
  };
});

const {
  mutate: deleteEvent,
  error: deleteEventError,
  loading: deleteEventLoading,
  onDone: onDoneDeleting,
} = useMutation(DELETE_EVENT, {
  variables: { id: eventId.value },
  update: (cache) => {
    cache.modify({
      fields: {
        events(existingEventRefs = [], { readField }) {
          return existingEventRefs.filter(
            (ref: any) => readField('id', ref) !== eventId.value
          );
        },
      },
    });
  },
});

onDoneDeleting(() => {
  if (channelId.value) {
    router.push({
      name: 'forums-forumId-events',
      params: { forumId: channelId.value },
    });
  }
});

const {
  mutate: cancelEvent,
  error: cancelEventError,
  loading: cancelEventLoading,
  onDone: onDoneCanceling,
} = useMutation(CANCEL_EVENT, {
  variables: {
    id: eventId.value,
    updateEventInput: { canceled: true },
    eventWhere: { id: eventId.value },
  },
});

onDoneCanceling(() => {
  confirmCancelIsOpen.value = false;
});

const {
  mutate: addFeedbackCommentToEvent,
  loading: addFeedbackCommentToEventLoading,
  error: addFeedbackCommentToEventError,
  onDone: onAddFeedbackCommentToEventDone,
} = useMutation(ADD_FEEDBACK_COMMENT_TO_EVENT);

onAddFeedbackCommentToEventDone(() => {
  showFeedbackFormModal.value = false;
  showFeedbackSubmittedSuccessfully.value = true;
});

const addressCopied = ref(false);

const copyAddress = async () => {
  try {
    const address = props.eventData.address || '';
    await navigator.clipboard.writeText(address);
    addressCopied.value = true;
    setTimeout(() => {
      addressCopied.value = false;
    }, 2000);
  } catch (error) {
    console.error(error);
  }
};

const copyLink = async () => {
  try {
    const basePath = window.location.origin;
    const permalink = `${basePath}${router.resolve(permalinkObject.value).href}`;
    await navigator.clipboard.writeText(permalink);
    showCopiedLinkNotification.value = true;
    setTimeout(() => {
      showCopiedLinkNotification.value = false;
    }, 2000);
  } catch (error) {
    console.error(error);
  }
};

const isAdmin = computed(() => {
  const serverRoles = props.eventData.Poster?.ServerRoles;
  return serverRoles && serverRoles?.length > 0 && serverRoles[0]?.showAdminTag;
});

const menuItems = computed(() => {
  if (!props.eventData) {
    return [];
  }

  // Use our utility function to get the menu items
  return getEventHeaderMenuItems({
    isOwnEvent: props.eventData?.Poster?.username === usernameVar.value,
    isArchived: !!props.eventIsArchived,
    isCanceled: !!props.eventData.canceled,
    userPermissions: userPermissions.value,
    isLoggedIn: !!usernameVar.value,
    eventId: props.eventData.id,
    isOnFeedbackPage: route.name === 'EventFeedback',
    feedbackEnabled:
      getChannelResult.value?.channels[0]?.feedbackEnabled ?? true,
    relatedIssueLink: relatedIssueLink.value,
  });
});

function getFormattedDateString(startTime: string) {
  // if the event is all day and spans multiple days,
  // include start and end date but not time
  if (props.eventData.isAllDay && props.eventData.endTime) {
    const start = DateTime.fromISO(startTime);
    const end = DateTime.fromISO(props.eventData.endTime);
    if (start.hasSame(end, 'day')) {
      return start.toFormat('cccc LLLL d yyyy');
    }
    return `${start.toFormat('cccc LLLL d yyyy')} - ${end.toFormat(
      'cccc LLLL d yyyy'
    )}`;
  }
  return DateTime.fromISO(startTime).toFormat('cccc LLLL d yyyy h:mm a');
}

const feedbackText = ref('');

function handleSubmitFeedback() {
  if (!feedbackText.value) {
    console.error('Feedback text is required');
    return;
  }
  if (!modProfileNameVar.value) {
    console.error('Mod profile name is required to submit feedback');
    return;
  }
  addFeedbackCommentToEvent({
    eventId: eventId.value,
    text: feedbackText.value,
    channelId: channelId.value,
    modProfileName: modProfileNameVar.value,
  });
}

function handleViewFeedback() {
  router.push({
    name: 'forums-forumId-events-feedback-eventId',
    params: {
      eventId: eventId.value,
      forumId: channelId.value,
    },
  });
}

function handleFeedbackInput(event: string) {
  feedbackText.value = event;
}
// Enhanced debug log to diagnose why permissionData is null
console.log('EVENT HEADER DEBUG:', {
  userPerms: userPermissions.value,
  queryParams: {
    modDisplayName: modProfileNameVar.value,
    username: usernameVar.value,
    channelUniqueName: props.eventChannelId || channelId.value || '',
    queryEnabled:
      !!modProfileNameVar.value &&
      !!usernameVar.value &&
      (!!props.eventChannelId || !!channelId.value),
  },
  permissionQueryResult: getPermissionResult.value,
  permissionData: permissionData.value,
  roles: {
    standardModRole: standardModRole.value,
    elevatedModRole: elevatedModRole.value,
  },
});
</script>

<template>
  <div>
    <ErrorBanner
      v-if="deleteEventError"
      class="mb-2"
      :text="deleteEventError.message"
    />
    <ErrorBanner
      v-if="cancelEventError"
      class="mb-2"
      :text="cancelEventError.message"
    />

    <div
      class="mb-4 flex justify-between border-b pb-2 pt-2 text-sm text-gray-700 dark:border-gray-500 dark:text-gray-200"
    >
      <ul class="space-y-2">
        <li class="hanging-indent flex items-start">
          <div class="mr-3 h-5 w-5">
            <CalendarIcon />
          </div>
          <span>{{
            `${getFormattedDateString(eventData.startTime)}, ${
              eventData.isAllDay
                ? 'all day'
                : getDuration(eventData.startTime, eventData.endTime)
            }`
          }}</span>
        </li>
        <li
          v-if="eventData.virtualEventUrl"
          class="hanging-indent flex items-start"
        >
          <div class="mr-3 h-5 w-5">
            <LinkIcon />
          </div>
          <a
            class="flex-1 cursor-pointer break-all underline"
            target="_blank"
            rel="noreferrer"
            :href="eventData.virtualEventUrl"
          >
            {{ eventData.virtualEventUrl }}
          </a>
        </li>
        <li v-if="eventData.address" class="hanging-indent flex items-start">
          <div class="mr-4 h-5 w-5">
            <LocationIcon />
          </div>
          <div class="inline">
            {{ eventData.address }}
            <button
              v-if="!addressCopied"
              type="button"
              class="inline-flex items-center"
              aria-label="Copy address to clipboard"
              @click="copyAddress"
            >
              <ClipboardIcon
                class="ml-1 inline-block h-4 w-4 cursor-pointer align-text-bottom"
              />
            </button>
            <span
              v-else
              class="ml-1 text-sm text-green-600 dark:text-green-400"
            >
              Copied!
            </span>
          </div>
        </li>
        <li
          v-if="!eventData.free && eventData.cost && eventData.cost !== '0'"
          class="hanging-indent flex items-start"
        >
          <div class="h-5 w-5">
            <i class="fa-solid fa-ticket h-5" />
          </div>
          <MarkdownPreview
            class="ml-3 flex-1"
            :disable-gallery="true"
            :text="eventData.cost"
          />
        </li>
        <li
          v-if="eventData.isHostedByOP && eventData.Poster"
          class="hanging-indent flex items-start"
        >
          <div class="mr-3 h-5 w-5">
            <i class="fa-regular fa-user h-5" />
          </div>
          <nuxt-link
            :to="{
              name: 'u-username',
              params: { username: eventData.Poster.username },
            }"
          >
            Hosted by
            <UsernameWithTooltip
              v-if="eventData.Poster.username"
              :is-admin="isAdmin || false"
              :username="eventData.Poster.username"
              :src="eventData.Poster.profilePicURL ?? ''"
              :display-name="eventData.Poster.displayName || ''"
              :comment-karma="eventData.Poster.commentKarma ?? 0"
              :discussion-karma="eventData.Poster.discussionKarma ?? 0"
              :account-created="eventData.Poster.createdAt"
            />
          </nuxt-link>
        </li>
      </ul>
      <div>
        <MenuButton
          v-if="showMenuButtons && eventData && menuItems.length > 0"
          :data-testid="'event-menu-button'"
          :items="menuItems"
          :aria-label="'Event actions'"
          @copy-link="copyLink"
          @handle-edit="
            router.push(`/forums/${channelId}/events/edit/${eventId}`)
          "
          @handle-delete="confirmDeleteIsOpen = true"
          @handle-cancel="confirmCancelIsOpen = true"
          @handle-report="showReportEventModal = true"
          @handle-feedback="showFeedbackFormModal = true"
          @handle-view-feedback="handleViewFeedback"
          @handle-click-archive="showArchiveModal = true"
          @handle-click-archive-and-suspend="showArchiveAndSuspendModal = true"
          @handle-click-unarchive="showUnarchiveModal = true"
        >
          <EllipsisHorizontal
            class="h-6 w-6 cursor-pointer hover:text-black dark:text-gray-300 dark:hover:text-white"
          />
        </MenuButton>
      </div>
    </div>

    <InfoBanner
      v-if="eventData.virtualEventUrl"
      :text="`The official event page is on an external website. Refer to the [official event page](${eventData.virtualEventUrl}) for the most complete, correct and up-to-date information.`"
    />

    <client-only>
      <div>
        <Notification
          :show="showCopiedLinkNotification"
          :title="'Copied to clipboard!'"
          @close-notification="showCopiedLinkNotification = false"
        />
        <WarningModal
          :title="'Delete Event'"
          :body="'Are you sure you want to delete this event?'"
          :open="confirmDeleteIsOpen"
          :loading="deleteEventLoading"
          @close="confirmDeleteIsOpen = false"
          @primary-button-click="deleteEvent"
        />
        <WarningModal
          v-if="confirmCancelIsOpen"
          :title="'Cancel Event'"
          :body="'Are you sure you want to cancel this event? This action cannot be undone.'"
          :open="confirmCancelIsOpen"
          :primary-button-text="'Yes, cancel the event'"
          :secondary-button-text="'No'"
          :loading="cancelEventLoading"
          :error="cancelEventError?.message"
          @close="confirmCancelIsOpen = false"
          @primary-button-click="cancelEvent"
        />
        <GenericFeedbackFormModal
          :open="showFeedbackFormModal"
          :error="addFeedbackCommentToEventError?.message"
          :loading="addFeedbackCommentToEventLoading"
          @update-feedback="handleFeedbackInput"
          @close="showFeedbackFormModal = false"
          @primary-button-click="handleSubmitFeedback"
        />
        <BrokenRulesModal
          v-if="eventData"
          :title="'Suspend Event Submitter'"
          :open="showArchiveAndSuspendModal"
          :event-title="eventData.title"
          :event-id="eventData.id"
          :event-channel-id="eventChannelId"
          :suspend-user-enabled="true"
          :text-box-label="'(Optional) Explain why you are suspending the event submitter:'"
          @close="showArchiveAndSuspendModal = false"
          @suspended-user-successfully="
            () => {
              showSuccessfullyArchivedAndSuspended = true;
              showArchiveAndSuspendModal = false;
            }
          "
        />
        <Notification
          :show="showSuccessfullyArchivedAndSuspended"
          :title="'Archived the post and suspended the author.'"
          @close-notification="showSuccessfullyArchivedAndSuspended = false"
        />
        <Notification
          :show="showFeedbackSubmittedSuccessfully"
          :title="'Your feedback has been recorded. Thank you!'"
          @close-notification="showFeedbackSubmittedSuccessfully = false"
        />
        <BrokenRulesModal
          :open="showReportEventModal"
          :event-title="eventData.title"
          :event-id="eventId"
          @close="showReportEventModal = false"
          @report-submitted-successfully="
            () => {
              showSuccessfullyReported = true;
              showReportEventModal = false;
            }
          "
        />
        <BrokenRulesModal
          :v-if="eventData && eventData.id"
          :open="showArchiveModal"
          :event-title="eventData?.title"
          :event-id="eventData?.id"
          :archive-after-reporting="true"
          :event-channel-id="eventChannelId"
          @close="showArchiveModal = false"
          @reported-and-archived-successfully="
            () => {
              showSuccessfullyArchived = true;
              showArchiveModal = false;
              $emit('archived-successfully');
            }
          "
        />
        <UnarchiveModal
          v-if="eventChannelId && eventData?.id"
          :open="showUnarchiveModal"
          :event-channel-id="eventChannelId"
          :event-id="eventData?.id"
          @close="showUnarchiveModal = false"
          @unarchived-successfully="
            () => {
              showSuccessfullyUnarchived = true;
              showUnarchiveModal = false;
            }
          "
        />
        <Notification
          :show="showSuccessfullyReported"
          :title="'Your report was submitted successfully.'"
          @close-notification="showSuccessfullyReported = false"
        />
        <Notification
          :show="showSuccessfullyArchived"
          :title="'The event was reported and archived successfully.'"
          @close-notification="showSuccessfullyArchived = false"
        />
        <Notification
          :show="showSuccessfullyUnarchived"
          :title="'The event was unarchived successfully.'"
          @close-notification="showSuccessfullyUnarchived = false"
        />
        <Notification
          :show="showSuccessfullySuspended"
          :title="'The event was suspended successfully.'"
          @close-notification="showSuccessfullySuspended = false"
        />
      </div>
    </client-only>
  </div>
</template>

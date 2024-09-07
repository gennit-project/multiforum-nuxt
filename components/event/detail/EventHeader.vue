<script lang="ts">
import type { PropType } from "vue";
import { defineComponent, computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Event } from "@/__generated__/graphql";
import {
  CANCEL_EVENT,
  DELETE_EVENT,
  ADD_FEEDBACK_COMMENT_TO_EVENT,
} from "@/graphQLData/event/mutations";
import CalendarIcon from "@/components/icons/CalendarIcon.vue";
import LinkIcon from "@/components/icons/LinkIcon.vue";
import LocationIcon from "@/components/icons/LocationIcon.vue";
import ClipboardIcon from "@/components/icons/ClipboardIcon.vue";
import Notification from "@/components/NotificationComponent.vue";
import { DateTime } from "luxon";
import MenuButton from "@/components/MenuButton.vue";
import EllipsisHorizontal from "@/components/icons/EllipsisHorizontal.vue";
import { useMutation, useQuery } from "@vue/apollo-composable";
import {
  GET_LOCAL_MOD_PROFILE_NAME,
  GET_LOCAL_USERNAME,
} from "@/graphQLData/user/queries";
import WarningModal from "@/components/WarningModal.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import UsernameWithTooltip from "@/components/UsernameWithTooltip.vue";
import { getDuration, ALLOWED_ICONS } from "@/utils";
import GenericFeedbackFormModal from "@/components/GenericFeedbackFormModal.vue";
import OpenIssueModal from "@/components/mod/OpenIssueModal.vue";

export default defineComponent({
  name: "EventHeader",
  components: {
    CalendarIcon,
    ClipboardIcon,
    EllipsisHorizontal,
    LinkIcon,
    LocationIcon,
    MenuButton,
    Notification,
    OpenIssueModal,
    WarningModal,
    ErrorBanner,
    UsernameWithTooltip,
    GenericFeedbackFormModal,
  },
  props: {
    eventData: {
      type: Object as PropType<Event>,
      required: true,
    },
    showMenuButtons: {
      type: Boolean,
      default: true,
    },
  },
  setup(props: any) {
    const route = useRoute();
    const router = useRouter();

    const showAddressCopiedNotification = ref(false);

    const eventId = computed(() => {
      if (typeof route.params.eventId === "string") {
        return route.params.eventId;
      }
      return "";
    });

    const {
      mutate: addFeedbackCommentToEvent,
      loading: addFeedbackCommentToEventLoading,
      error: addFeedbackCommentToEventError,
      onDone: onAddFeedbackCommentToEventDone,
    } = useMutation(ADD_FEEDBACK_COMMENT_TO_EVENT);

    const showFeedbackFormModal = ref(false);
    const showFeedbackSubmittedSuccessfully = ref(false);

    onAddFeedbackCommentToEventDone(() => {
      showFeedbackFormModal.value = false;
      showFeedbackSubmittedSuccessfully.value = true;
    });

    const {
      result: localModProfileNameResult,
      loading: localModProfileNameLoading,
      error: localModProfileNameError,
    } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

    const loggedInUserModName = computed(() => {
      if (localModProfileNameLoading.value || localModProfileNameError.value) {
        return "";
      }
      return localModProfileNameResult.value?.modProfileName || "";
    });

    const {
      mutate: deleteEvent,
      error: deleteEventError,
      onDone: onDoneDeleting,
    } = useMutation(DELETE_EVENT, {
      variables: {
        id: eventId.value,
      },
      update: (cache: any) => {
        cache.modify({
          fields: {
            events(existingEventRefs = [], fieldInfo: any) {
              const readField = fieldInfo.readField;

              return existingEventRefs.filter((ref) => {
                return readField("id", ref) !== eventId.value;
              });
            },
          },
        });
      },
    });

    onDoneDeleting(() => {
      if (channelId.value) {
        router.push({
          name: "SearchEventsInChannel",
          params: {
            forumId: channelId.value,
          },
        });
      }
    });

    const copyAddress = async () => {
      try {
        const address = props.eventData.address ? props.eventData.address : "";

        const clipboard = new ClipboardJS(".copy-btn", {
          text: () => address,
        });

        clipboard.on("success", () => {
          showAddressCopiedNotification.value = true;
          clipboard.destroy();
        });

        clipboard.on("error", (e) => {
          console.error(e);
          clipboard.destroy();
        });
      } catch (e: any) {
        throw new Error(e);
      }
      setTimeout(() => {
        showAddressCopiedNotification.value = false;
      }, 2000);
    };

    const channelId = computed(() => {
      if (typeof route.params.forumId === "string") {
        return route.params.forumId;
      }

      const defaultChannelId =
        props.eventData?.EventChannels?.[0]?.channelUniqueName;

      if (typeof defaultChannelId === "string") {
        return defaultChannelId;
      }
      return "";
    });

    const showCopiedLinkNotification = ref(false);

    const permalinkObject = computed(() => {
      if (!eventId.value) {
        return {};
      }
      return {
        name: "EventDetail",
        params: {
          eventId: eventId.value,
          forumId: channelId.value,
        },
      };
    });

    const copyLink = async (event: any) => {
      try {
        let basePath = "";
        if (import.meta.client) {
          basePath = window.location.origin;
        } else {
          basePath = process.env.BASE_URL || "";
        }
        const permalink = `${basePath}${
          router.resolve(permalinkObject.value).href
        }`;
        await navigator.clipboard.writeText(permalink);
        showCopiedLinkNotification.value = event;
      } catch (e: any) {
        throw new Error(e);
      }
      setTimeout(() => {
        showCopiedLinkNotification.value = false;
      }, 2000);
    };

    const {
      result: localUsernameResult,
      loading: localUsernameLoading,
      error: localUsernameError,
    } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      if (localUsernameLoading.value || localUsernameError.value) {
        return "";
      }
      return localUsernameResult.value.username;
    });

    const menuItems = computed(() => {
      let out = [];
      if (props.eventData && route.name !== "EventFeedback") {
        out.push({
          label: "Copy Link",
          value: "",
          event: "copyLink",
          icon: ALLOWED_ICONS.COPY_LINK,
        });
      }

      if (props.eventData?.Poster?.username === username.value) {
        out = out.concat([
          {
            label: "Edit",
            value: "",
            event: "handleEdit",
            icon: ALLOWED_ICONS.EDIT,
          },
          {
            label: "Delete",
            value: "",
            event: "handleDelete",
            icon: ALLOWED_ICONS.DELETE,
          },
        ]);

        if (route.name !== "EventFeedback") {
          out = out.concat([
            {
              label: "View Feedback",
              value: "",
              event: "handleViewFeedback",
              icon: ALLOWED_ICONS.VIEW_FEEDBACK,
            },
          ]);
        }

        if (!props.eventData.canceled) {
          out.push({
            label: "Cancel",
            value: "",
            event: "handleCancel",
            icon: ALLOWED_ICONS.CANCEL,
          });
        }
      } else {
        out = out.concat([
          {
            label: "Report",
            value: "",
            event: "handleReport",
            icon: ALLOWED_ICONS.REPORT,
          },
        ]);

        if (route.name !== "EventFeedback") {
          out = out.concat([
            {
              label: "Give Feedback",
              value: "",
              event: "handleFeedback",
              icon: ALLOWED_ICONS.GIVE_FEEDBACK,
            },
            {
              label: "View Feedback",
              value: "",
              event: "handleViewFeedback",
              icon: ALLOWED_ICONS.VIEW_FEEDBACK,
            },
          ]);
        }
      }

      return out;
    });

    const {
      mutate: cancelEvent,
      error: cancelEventError,
      loading: cancelEventLoading,
      onDone: onDoneCanceling,
    } = useMutation(CANCEL_EVENT, {
      variables: {
        id: eventId.value,
        updateEventInput: {
          canceled: true,
        },
        eventWhere: {
          id: eventId.value,
        },
      },
    });

    const isAdmin = computed(() => {
      const serverRoles = props.eventData.Poster?.ServerRoles;
      if (!serverRoles) {
        return false;
      }
      if (serverRoles.length === 0) {
        return false;
      }
      const serverRole = serverRoles[0];
      if (serverRole.showAdminTag) {
        return true;
      }
      return false;
    });

    const confirmDeleteIsOpen = ref(false);
    const confirmCancelIsOpen = ref(false);

    onDoneCanceling(() => {
      // Close cancel event modal when finished.
      confirmCancelIsOpen.value = false;
    });

    return {
      addFeedbackCommentToEvent,
      addFeedbackCommentToEventLoading,
      addFeedbackCommentToEventError,
      cancelEvent,
      cancelEventError,
      cancelEventLoading,
      confirmCancelIsOpen,
      confirmDeleteIsOpen,
      channelId,
      copyAddress,
      copyLink,
      deleteEvent,
      deleteEventError,
      eventId,
      getDuration,
      feedbackText: ref(""),
      isAdmin,
      loggedInUserModName,
      menuItems,
      reportModalIsOpen: ref(false),
      route,
      router,
      showFeedbackFormModal,
      showFeedbackSubmittedSuccessfully,
      showReportEventModal: ref(false),
      showSuccessfullyReported: ref(false),
      showAddressCopiedNotification,
      showCopiedLinkNotification,
    };
  },
  methods: {
    getFormattedDateString(startTime: string) {
      const startTimeObj = DateTime.fromISO(startTime);

      return startTimeObj.toFormat("cccc LLLL d yyyy h:mm a");
    },
    handleSubmitFeedback() {
      this.addFeedbackCommentToEvent({
        eventId: this.eventId,
        text: this.feedbackText,
        channelId: this.channelId,
        modProfileName: this.loggedInUserModName,
      });
    },
    handleFeedbackInput(event: any) {
      this.feedbackText = event.target.value;
    },
    handleReportEvent() {
      this.showReportEventModal = false;
    },
    handleClickReport() {
      this.showReportEventModal = true;
    },
    handleClickGiveFeedback() {
      this.showFeedbackFormModal = true;
    },
    handleViewFeedback() {
      this.$router.push({
        name: "EventFeedback",
        params: {
          eventId: this.eventId,
          forumId: this.channelId,
        },
      });
    },
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
  </div>
  <div
    class="flex justify-between px-4 text-sm text-gray-700 dark:text-gray-200"
  >
    <ul class="space-y-2">
      <li class="hanging-indent flex items-start">
        <div class="mr-3 h-5 w-5">
          <CalendarIcon />
        </div>
        <span>{{
          `${getFormattedDateString(eventData.startTime)}, ${
            eventData.isAllDay
              ? "all day"
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
          class="cursor-pointer underline"
          target="_blank"
          rel="noreferrer"
          :href="eventData.virtualEventUrl"
        >
          {{ eventData.virtualEventUrl }}
        </a>
      </li>
      <li v-if="eventData.address" class="hanging-indent flex items-start">
        <div class="mr-3 h-5 w-5">
          <LocationIcon />
        </div>
        <div class="flex">
          <span>
            {{ eventData.address }}
          </span>
          <span>
            <ClipboardIcon
              class="ml-1 h-4 w-4 cursor-pointer"
              @click="copyAddress"
            />
            <v-tooltip activator="parent" location="top"> Copy </v-tooltip>
          </span>
        </div>
      </li>
      <li
        v-if="!eventData.free && eventData.cost && eventData.cost !== '0'"
        class="hanging-indent flex items-start"
      >
        <div class="mr-3 h-5 w-5">
          <i class="fa-solid fa-ticket h-5" />
        </div>
        <span>{{ eventData.cost }}</span>
      </li>
      <li
        v-if="eventData.isHostedByOP && eventData.Poster"
        class="hanging-indent flex items-start"
      >
        <div class="mr-3 h-5 w-5">
          <i class="fa-regular fa-user h-5" />
        </div>
        <router-link :to="`/u/${eventData.Poster.username}`">
          Hosted by
          <UsernameWithTooltip
            v-if="eventData.Poster.username"
            :is-admin="isAdmin"
            :username="eventData.Poster.username"
            :src="eventData.Poster.profilePicURL ?? ''"
            :display-name="eventData.Poster.displayName || ''"
            :comment-karma="eventData.Poster.commentKarma ?? 0"
            :discussion-karma="eventData.Poster.discussionKarma ?? 0"
            :account-created="eventData.Poster.createdAt"
          />
        </router-link>
      </li>
    </ul>
    <div>
      <MenuButton
        v-if="showMenuButtons && eventData && menuItems.length > 0"
        data-testid="event-menu-button"
        :items="menuItems"
        @copy-link="copyLink"
        @handle-edit="
          router.push(`/forums/f/${channelId}/events/e/${eventId}/edit`)
        "
        @handle-delete="confirmDeleteIsOpen = true"
        @handle-cancel="confirmCancelIsOpen = true"
        @handle-report="handleClickReport"
        @handle-feedback="handleClickGiveFeedback"
        @handle-view-feedback="handleViewFeedback"
      >
        <EllipsisHorizontal
          class="h-6 w-6 cursor-pointer hover:text-black dark:text-gray-300 dark:hover:text-white"
        />
      </MenuButton>
    </div>
    <Notification
      :show="showAddressCopiedNotification"
      :title="'Copied to clipboard!'"
      @close-notification="showAddressCopiedNotification = false"
    />
    <Notification
      :show="showCopiedLinkNotification"
      :title="'Copied to clipboard!'"
      @close-notification="showCopiedLinkNotification = false"
    />
    <WarningModal
      :title="'Delete Event'"
      :body="'Are you sure you want to delete this event?'"
      :open="confirmDeleteIsOpen"
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
      :error="cancelEventError"
      @close="confirmCancelIsOpen = false"
      @primary-button-click="cancelEvent"
    />
    <GenericFeedbackFormModal
      :open="showFeedbackFormModal"
      :error="addFeedbackCommentToEventError?.message"
      :loading="addFeedbackCommentToEventLoading"
      @input="handleFeedbackInput"
      @close="showFeedbackFormModal = false"
      @primary-button-click="handleSubmitFeedback"
    />
    <Notification
      :show="showFeedbackSubmittedSuccessfully"
      :title="'Your feedback has been recorded. Thank you!'"
      @close-notification="showFeedbackSubmittedSuccessfully = false"
    />
    <OpenIssueModal
      :open="showReportEventModal"
      :event-title="eventData.title"
      @close="showReportEventModal = false"
      @report-submitted-successfully="
        () => {
          showSuccessfullyReported = true;
          showReportEventModal = false;
        }
      "
    />
    <Notification
      :show="showSuccessfullyReported"
      :title="'Your report was submitted successfully.'"
      @close-notification="showSuccessfullyReported = false"
    />
  </div>
</template>

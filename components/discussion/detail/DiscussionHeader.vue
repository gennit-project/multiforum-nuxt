<script lang="ts" setup>
import { ref, computed } from "vue";
import { useMutation } from "@vue/apollo-composable";
import { useRoute, useRouter } from "nuxt/app";
import { DateTime } from "luxon";
import { DELETE_DISCUSSION } from "@/graphQLData/discussion/mutations";
import WarningModal from "@/components/WarningModal.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import UsernameWithTooltip from "@/components/UsernameWithTooltip.vue";
import Notification from "@/components/NotificationComponent.vue";
import OpenIssueModal from "@/components/mod/OpenIssueModal.vue";
import EllipsisHorizontal from "@/components/icons/EllipsisHorizontal.vue";
import { ALLOWED_ICONS } from "@/utils";
import { usernameVar, modProfileNameVar } from "@/cache";
import UnarchiveModal from "@/components/mod/UnarchiveModal.vue";

type MenuItem = {
  label?: string;
  value: string;
  event?: string;
  icon?: string;
  isDivider?: boolean;
};
const props = defineProps({
  discussion: {
    type: Object,
    required: false,
    default: null,
  },
  discussionChannelId: {
    type: String,
    required: false,
    default: "",
  },
  compactMode: {
    type: Boolean,
    required: false,
    default: false,
  },
  channelId: {
    type: String,
    required: false,
    default: null,
  },
  showActionMenu: {
    type: Boolean,
    required: false,
    default: true,
  },
  discussionBodyEditMode: {
    type: Boolean,
    required: false,
    default: false,
  },
  discussionIsArchived: {
    type: Boolean || undefined || null,
    // boolean or undefined or null
    default: false,
  },
});

const emit = defineEmits([
  "handleClickGiveFeedback",
  "handleClickEditBody",
  "cancelEditDiscussionBody",
]);

const route = useRoute();
const router = useRouter();

const relativeTime = (date: string) => DateTime.fromISO(date).toRelative();

const editedAt = computed(() => {
  if (!props.discussion?.updatedAt) return "";
  return `Edited ${relativeTime(props.discussion.updatedAt)}`;
});

const createdAt = computed(() => {
  if (!props.discussion?.createdAt) return "";
  return `Posted ${relativeTime(props.discussion.createdAt)}`;
});

const {
  mutate: deleteDiscussion,
  loading: deleteDiscussionLoading,
  error: deleteDiscussionError,
  onDone: onDoneDeleting,
} = useMutation(DELETE_DISCUSSION, {
  variables: { id: props.discussion?.id },
  update: (cache, { data }) => {
    if (data?.deleteDiscussions?.nodesDeleted > 0) {
      cache.evict({
        id: cache.identify({
          __typename: "Discussion",
          id: props.discussion?.id,
        }),
      });
    }
  },
});

onDoneDeleting(() => {
  if (props.channelId) {
    router.push({
      name: "forums-forumId-discussions",
      params: { forumId: props.channelId },
    });
  }
});

const defaultChannel = computed(() => {
  if (!props.discussion) {
    return "";
  }
  const channelInRoute = route.params.forumId;
  return (
    channelInRoute || props.discussion?.DiscussionChannels[0].channelUniqueName
  );
});

const permalinkObject = computed(() => {
  if (!props.discussion) return {};
  return {
    name: "forums-forumId-discussions-discussionId",
    params: {
      discussionId: props.discussion.id,
      forumId: defaultChannel.value,
    },
  };
});

const showCopiedLinkNotification = ref(false);

const copyLink = async (event: any) => {
  try {
    let basePath = "";
    if (import.meta.client) {
      basePath = window.location.origin;
    } else {
      basePath = process.env.BASE_URL || "";
    }
    const permalink = `${basePath}${router.resolve(permalinkObject.value).href}`;
    await navigator.clipboard.writeText(permalink);
    showCopiedLinkNotification.value = event;
  } catch (e) {
    console.error(e);
  }
  setTimeout(() => {
    showCopiedLinkNotification.value = false;
  }, 2000);
};
const deleteModalIsOpen = ref(false);

const showOpenIssueModal = ref(false);
const showArchiveModal = ref(false);
const showUnarchiveModal = ref(false);

const showSuccessfullyReported = ref(false);
const showSuccessfullyArchived = ref(false);
const showSuccessfullyUnarchived = ref(false);

const menuItems = computed(() => {
  let out: MenuItem[] = [];

  if (props.discussion) {
    out = out.concat([
      {
        label: "View Feedback",
        event: "handleViewFeedback",
        icon: ALLOWED_ICONS.VIEW_FEEDBACK,
        value: props.discussion.id,
      },
      {
        label: "Copy Link",
        event: "copyLink",
        icon: ALLOWED_ICONS.COPY_LINK,
        value: props.discussion.id,
      },
    ]);

    if (props.discussion?.Author?.username === usernameVar.value) {
      out.push({
        label: "Edit",
        event: "handleEdit",
        icon: ALLOWED_ICONS.EDIT,
        value: props.discussion.id,
      });
      out.push({
        label: "Delete",
        event: "handleDelete",
        icon: ALLOWED_ICONS.DELETE,
        value: props.discussion.id,
      });
    } else if (usernameVar.value && modProfileNameVar.value) {
      out = out.concat([
        {
          value: "Moderation Actions",
          isDivider: true,
        },
        {
          label: "Report",
          event: "handleClickReport",
          icon: ALLOWED_ICONS.REPORT,
          value: props.discussion.id,
        },
        {
          label: "Give Feedback",
          event: "handleFeedback",
          icon: ALLOWED_ICONS.GIVE_FEEDBACK,
          value: props.discussion.id,
        },
      ]);
      // Only add these if mod permissions are elevated
      if (!props.discussionIsArchived) {
        out = out.concat([
          {
            label: "Archive",
            event: "handleClickArchive",
            icon: ALLOWED_ICONS.ARCHIVE,
            value: props.discussion.id,
          },
          {
            label: "Archive and Suspend",
            event: "handleClickArchiveAndSuspend",
            icon: ALLOWED_ICONS.SUSPEND,
            value: props.discussion.id,
          },
        ]);
      } else {
        out = out.concat([
          {
            label: "Unarchive",
            event: "handleClickUnarchive",
            icon: ALLOWED_ICONS.UNARCHIVE,
            value: props.discussion.id,
          },
        ]);
      }
    }
  }
  return out;
});

const authorIsAdmin = computed(
  () => props.discussion?.Author?.ServerRoles?.[0]?.showAdminTag || false
);
const authorIsMod = computed(
  () => props.discussion?.Author?.ChannelRoles?.[0]?.showModTag || false
);
</script>

<template>
  <div class="mb-4">
    <div class="mt-2 flex justify-between">
      <div
        class="flex flex-wrap items-center space-x-2 text-xs dark:text-white"
      >
        <AvatarComponent
          :text="discussion?.Author?.username ?? '[Deleted]'"
          :src="discussion?.Author?.profilePicURL ?? ''"
          :is-small="true"
        />
        <nuxt-link
          v-if="discussion?.Author"
          class="cursor-pointer font-bold text-black hover:underline dark:text-white"
          :to="{
            name: 'u-username',
            params: { username: discussion.Author.username },
          }"
        >
          <UsernameWithTooltip
            :is-admin="authorIsAdmin"
            :is-mod="authorIsMod"
            :username="discussion.Author.username"
            :src="discussion.Author.profilePicURL ?? ''"
            :display-name="discussion.Author.displayName ?? ''"
            :comment-karma="discussion.Author.commentKarma ?? 0"
            :discussion-karma="discussion.Author.discussionKarma ?? 0"
            :account-created="discussion.Author.createdAt"
          />
        </nuxt-link>
        <span v-else>[Deleted]</span>
        <div>{{ createdAt }}</div>
        <span v-if="discussion?.updatedAt" class="mx-2">&#8226;</span>
        <div>{{ editedAt }}</div>
      </div>
      <div class="flex items-center gap-2">
        <div v-if="usernameVar === discussion?.Author?.username">
          <button
            v-if="!discussionBodyEditMode"
            type="button"
            class="flex align-items gap-2 text-xs text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
            @click="$emit('handleClickEditBody')"
          >
            Edit
          </button>
          <button
            v-else-if="usernameVar"
            type="button"
            class="text-xs text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white"
            @click="$emit('cancelEditDiscussionBody')"
          >
            Cancel
          </button>
        </div>
        <MenuButton
          v-if="showActionMenu && discussion && menuItems.length > 0"
          :items="menuItems"
          :data-testid="'discussion-menu-button'"
          @copy-link="copyLink"
          @handle-edit="
            router.push(
              `/forums/${channelId}/discussions/edit/${discussion.id}`
            )
          "
          @handle-delete="deleteModalIsOpen = true"
          @handle-click-report="showOpenIssueModal = true"
          @handle-click-archive="showArchiveModal = true"
          @handle-click-unarchive="showUnarchiveModal = true"
          @handle-feedback="emit('handleClickGiveFeedback')"
          @handle-view-feedback="
            router.push({
              name: 'forums-forumId-discussions-feedback-discussionId',
              params: {
                forumId: defaultChannel,
                discussionId: discussion.id,
              },
            })
          "
        >
          <EllipsisHorizontal
            class="h-6 w-6 cursor-pointer hover:text-black dark:text-gray-300 dark:hover:text-white"
          />
        </MenuButton>
      </div>
    </div>
    <WarningModal
      :title="'Delete Discussion'"
      :body="'Are you sure you want to delete this discussion?'"
      :open="deleteModalIsOpen"
      :icon="'trash'"
      :loading="deleteDiscussionLoading"
      @close="deleteModalIsOpen = false"
      @primary-button-click="deleteDiscussion"
    />
    <OpenIssueModal
      v-if="discussion"
      :open="showOpenIssueModal"
      :discussion-title="discussion?.title"
      :discussion-id="discussion?.id"
      :archive-after-reporting="false"
      @close="showOpenIssueModal = false"
      @report-submitted-successfully="
        () => {
          showSuccessfullyReported = true;
          showOpenIssueModal = false;
        }
      "
    />
    <OpenIssueModal
      :v-if="discussion"
      :open="showArchiveModal"
      :discussion-title="discussion?.title"
      :discussion-id="discussion?.id"
      :archive-after-reporting="true"
      :discussion-channel-id="discussionChannelId"
      @close="showArchiveModal = false"
      @reported-and-archived-successfully="
        () => {
          showSuccessfullyArchived = true;
          showArchiveModal = false;
        }
      "
    />
    <UnarchiveModal
      v-if="discussionChannelId && discussion?.id"
      :open="showUnarchiveModal"
      :discussion-channel-id="discussionChannelId"
      :discussion-id="discussion?.id"
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
      :title="'The content was reported and archived successfully.'"
      @close-notification="showSuccessfullyArchived = false"
    />
    <Notification
      :show="showSuccessfullyUnarchived"
      :title="'The content was unarchived successfully.'"
      @close-notification="showSuccessfullyUnarchived = false"
    />
    <ErrorBanner
      v-if="deleteDiscussionError"
      class="mt-2"
      :text="deleteDiscussionError.message"
    />
    <Notification
      :show="showCopiedLinkNotification"
      :title="'Copied to clipboard!'"
      @close-notification="showCopiedLinkNotification = false"
    />
  </div>
</template>

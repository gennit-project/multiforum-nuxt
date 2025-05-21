<script lang="ts" setup>
  import { ref, computed } from "vue";
  import { useMutation, useQuery } from "@vue/apollo-composable";
  import { useRoute, useRouter } from "nuxt/app";
  import { DateTime } from "luxon";
  import { DELETE_DISCUSSION } from "@/graphQLData/discussion/mutations";
  import WarningModal from "@/components/WarningModal.vue";
  import ErrorBanner from "@/components/ErrorBanner.vue";
  import Notification from "@/components/NotificationComponent.vue";
  import BrokenRulesModal from "@/components/mod/BrokenRulesModal.vue";
  import EllipsisHorizontal from "@/components/icons/EllipsisHorizontal.vue";
  import { getAllPermissions } from "@/utils/permissionUtils";
  import { getDiscussionHeaderMenuItems } from "@/utils/headerPermissionUtils";
  import { usernameVar, modProfileNameVar } from "@/cache";
  import UnarchiveModal from "@/components/mod/UnarchiveModal.vue";
  import { GET_CHANNEL } from "@/graphQLData/channel/queries";
  import { USER_IS_MOD_OR_OWNER_IN_CHANNEL } from "@/graphQLData/user/queries";
  import { GET_SERVER_CONFIG } from "@/graphQLData/admin/queries";
  import { config } from "@/config";

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
    "handleClickAddAlbum",
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
    return channelInRoute || props.discussion?.DiscussionChannels[0].channelUniqueName;
  });

  // Query the channel data to get roles
  const { result: getChannelResult } = useQuery(
    GET_CHANNEL,
    {
      uniqueName: props.channelId || defaultChannel.value,
      // Using luxon, round down to the nearest hour
      now: DateTime.local().startOf("hour").toISO(),
    },
    {
      fetchPolicy: "cache-first",
      nextFetchPolicy: "cache-first",
      enabled: computed(() => !!props.channelId || !!defaultChannel.value),
    }
  );

  // Query server config to get default roles
  const { result: getServerResult } = useQuery(
    GET_SERVER_CONFIG,
    {
      serverName: config.serverName,
    },
    {
      fetchPolicy: "cache-first",
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
      modDisplayName: modProfileNameVar,
      username: usernameVar,
      channelUniqueName: props.channelId || defaultChannel.value || "",
    },
    {
      // enable if the username and modDisplayName are set
      enabled: computed(
        () =>
          !!usernameVar.value &&
          !!modProfileNameVar.value &&
          !!props.channelId &&
          !!defaultChannel.value
      ),
      fetchPolicy: "cache-first",
    }
  );

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

  const showBrokenRulesModal = ref(false);
  const showArchiveModal = ref(false);
  const showUnarchiveModal = ref(false);
  const showArchiveAndSuspendModal = ref(false);

  const showSuccessfullyReported = ref(false);
  const showSuccessfullyArchived = ref(false);
  const showSuccessfullyUnarchived = ref(false);
  const showSuccessfullyArchivedAndSuspended = ref(false);

  const menuItems = computed(() => {
    if (!props.discussion) {
      return [];
    }

    // Use our utility function to get the menu items
    return getDiscussionHeaderMenuItems({
      isOwnDiscussion: props.discussion?.Author?.username === usernameVar.value,
      isArchived: !!props.discussionIsArchived,
      userPermissions: userPermissions.value,
      isLoggedIn: !!usernameVar.value,
      discussionId: props.discussion.id,
      hasAlbum: !!props.discussion?.Album?.Images?.length,
    });
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
      <div class="flex flex-wrap items-center space-x-2 text-xs dark:text-white">
        <AvatarComponent
          :is-small="true"
          :src="discussion?.Author?.profilePicURL ?? ''"
          :text="discussion?.Author?.username ?? '[Deleted]'"
        />
        <nuxt-link
          v-if="discussion?.Author"
          class="cursor-pointer font-bold text-black hover:underline dark:text-white"
          :to="{
            name: 'u-username',
            params: { username: discussion.Author.username },
          }"
        >
          <span class="flex flex-row items-center gap-1">
            <span
              v-if="!discussion.Author.displayName"
              class="font-bold"
              >{{ discussion.Author.username }}</span
            >
            <span
              v-else
              class="font-bold"
              >{{ discussion.Author.displayName }}</span
            >
            <span
              v-if="discussion.Author.displayName"
              class="text-gray-500 dark:text-gray-300"
              >{{ `(u/${discussion.Author.username})` }}</span
            >

            <span
              v-if="authorIsAdmin"
              class="rounded-md border border-gray-500 px-1 py-0 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300"
              >Admin</span
            >
            <span
              v-else-if="authorIsMod"
              class="rounded-md border border-blue-500 px-1 py-0 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300"
              >Mod</span
            >
          </span>
        </nuxt-link>
        <span v-else>[Deleted]</span>
        <div>{{ createdAt }}</div>
        <span
          v-if="discussion?.updatedAt"
          class="mx-2"
          >&#8226;</span
        >
        <div>{{ editedAt }}</div>
      </div>
      <div class="flex items-center gap-2">
        <div v-if="usernameVar === discussion?.Author?.username">
          <button
            v-if="!discussionBodyEditMode"
            class="align-items flex gap-2 text-xs text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white"
            type="button"
            @click="$emit('handleClickEditBody')"
          >
            Edit
          </button>
          <button
            v-else-if="usernameVar"
            class="text-xs text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white"
            type="button"
            @click="$emit('cancelEditDiscussionBody')"
          >
            Cancel
          </button>
        </div>
        <MenuButton
          v-if="showActionMenu && discussion && menuItems.length > 0"
          :data-testid="'discussion-menu-button'"
          :items="menuItems"
          @copy-link="copyLink"
          @handle-add-album="emit('handleClickAddAlbum')"
          @handle-click-archive="showArchiveModal = true"
          @handle-click-archive-and-suspend="showArchiveAndSuspendModal = true"
          @handle-click-report="showBrokenRulesModal = true"
          @handle-click-unarchive="showUnarchiveModal = true"
          @handle-delete="deleteModalIsOpen = true"
          @handle-edit="router.push(`/forums/${channelId}/discussions/edit/${discussion.id}`)"
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
      :body="'Are you sure you want to delete this discussion?'"
      :icon="'trash'"
      :loading="deleteDiscussionLoading"
      :open="deleteModalIsOpen"
      :title="'Delete Discussion'"
      @close="deleteModalIsOpen = false"
      @primary-button-click="deleteDiscussion"
    />
    <BrokenRulesModal
      v-if="discussion"
      :archive-after-reporting="false"
      :discussion-id="discussion?.id"
      :discussion-title="discussion?.title"
      :open="showBrokenRulesModal"
      @close="showBrokenRulesModal = false"
      @report-submitted-successfully="
        () => {
          showSuccessfullyReported = true;
          showBrokenRulesModal = false;
        }
      "
    />
    <BrokenRulesModal
      :archive-after-reporting="true"
      :discussion-channel-id="discussionChannelId"
      :discussion-id="discussion?.id"
      :discussion-title="discussion?.title"
      :open="showArchiveModal"
      :v-if="discussion"
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
      :discussion-channel-id="discussionChannelId"
      :discussion-id="discussion?.id"
      :open="showUnarchiveModal"
      @close="showUnarchiveModal = false"
      @unarchived-successfully="
        () => {
          showSuccessfullyUnarchived = true;
          showUnarchiveModal = false;
        }
      "
    />
    <BrokenRulesModal
      v-if="discussion"
      :discussion-channel-id="discussionChannelId"
      :discussion-id="discussion.id"
      :discussion-title="discussion.title"
      :open="showArchiveAndSuspendModal"
      :suspend-user-enabled="true"
      :text-box-label="'(Optional) Explain why you are suspending this author:'"
      :title="'Suspend Author'"
      @close="showArchiveAndSuspendModal = false"
      @suspended-user-successfully="
        () => {
          showSuccessfullyArchivedAndSuspended = true;
          showArchiveAndSuspendModal = false;
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
      :show="showSuccessfullyArchivedAndSuspended"
      :title="'Archived the post and suspended the author.'"
      @close-notification="showSuccessfullyArchivedAndSuspended = false"
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

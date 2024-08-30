<script lang="ts">
import type { PropType} from "vue";
import { defineComponent, computed, ref } from "vue";
import type { Discussion } from "@/src/__generated__/graphql";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { useRoute, useRouter } from "vue-router";
import { DateTime } from "luxon";
import { DELETE_DISCUSSION } from "@/graphQLData/discussion/mutations";
import WarningModal from "../../WarningModal.vue";
import ErrorBanner from "../../ErrorBanner.vue";
import { useDisplay } from "vuetify";
import UsernameWithTooltip from "@/components/UsernameWithTooltip.vue";
import MenuButton, { ALLOWED_ICONS } from "@/components/MenuButton.vue";
import useClipboard from "vue-clipboard3";
import {
  GET_LOCAL_MOD_PROFILE_NAME,
  GET_LOCAL_USERNAME,
} from "@/graphQLData/user/queries";
import Notification from "@/components/Notification.vue";
import OpenIssueModal from "@/components/mod/OpenIssueModal.vue";
import EllipsisHorizontal from "@/components/icons/EllipsisHorizontal.vue";

type MenuItem = {
  label: string;
  value: string;
  event: string;
  icon: string;
};

export default defineComponent({
  components: {
    EllipsisHorizontal,
    ErrorBanner,
    MenuButton,
    WarningModal,
    UsernameWithTooltip,
    Notification,
    OpenIssueModal,
  },
  props: {
    discussion: {
      type: Object as PropType<Discussion | null>,
      required: false,
      default: null,
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
  },
  setup(props) {
    const route = useRoute();
    const router = useRouter();

    const editedAt = computed(() => {
      if (!props.discussion?.updatedAt) {
        return "";
      }
      return `Edited ${relativeTime(props.discussion.updatedAt)}`;
    });

    const createdAt = computed(() => {
      if (!props.discussion?.createdAt) {
        return "";
      }
      return `posted ${relativeTime(props.discussion?.createdAt)}`;
    });

    const {
      mutate: deleteDiscussion,
      error: deleteDiscussionError,
      loading: deleteDiscussionLoading,
      onDone: onDoneDeleting,
    } = useMutation(DELETE_DISCUSSION, {
      variables: {
        id: props.discussion?.id,
      },
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
          name: "SearchDiscussionsInChannel",
          params: {
            channelId: props.channelId,
          },
        });
      }
    });

    const defaultChannel = computed(() => {
      if (!props.discussion) {
        return "";
      }
      const channelInRoute = route.params.channelId;

      if (channelInRoute) {
        return channelInRoute;
      }
      return props.discussion.DiscussionChannels[0].channelUniqueName;
    });

    const permalinkObject = computed(() => {
      if (!props.discussion) {
        return {};
      }
      return {
        name: "DiscussionDetail",
        params: {
          discussionId: props.discussion.id,
          channelId: defaultChannel.value,
        },
      };
    });

    const { toClipboard } = useClipboard();

    const showCopiedLinkNotification = ref(false);

    const copyLink = async (event: any) => {
      try {
        const basePath = window.location.origin;
        const permalink = `${basePath}${
          router.resolve(permalinkObject.value).href
        }`;
        await toClipboard(permalink);
        showCopiedLinkNotification.value = event;
      } catch (e: any) {
        throw new Error(e);
      }
      setTimeout(() => {
        showCopiedLinkNotification.value = false;
      }, 2000);
    };

    const deleteModalIsOpen = ref(false);
    const showOpenIssueModal = ref(false);

    const { lgAndDown, lgAndUp, mdAndDown, mdAndUp, xlAndUp } = useDisplay();

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

    const {
      result: localModProfileNameResult,
      loading: localModProfileNameLoading,
      error: localModProfileNameError,
    } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

    const loggedInUserModName = computed(() => {
      if (localModProfileNameLoading.value || localModProfileNameError.value) {
        return "";
      }
      return localModProfileNameResult.value.modProfileName;
    });

    const menuItems = computed(() => {
      let out: MenuItem[] = [];

      if (props.discussion) {
        if (route.name !== "DiscussionFeedback") {
          out = out.concat([
            {
              label: "View Feedback",
              value: "",
              event: "handleViewFeedback",
              icon: ALLOWED_ICONS.VIEW_FEEDBACK,
            },
            {
              label: "Copy Link",
              value: "",
              event: "copyLink",
              icon: ALLOWED_ICONS.COPY_LINK,
            },
          ]);
        }
      }

      if (props.discussion?.Author?.username === username.value) {
        // If it's your own post, you can edit or delete it.
        out.push({
          label: "Edit",
          value: "",
          event: "handleEdit",
          icon: ALLOWED_ICONS.EDIT,
        });
        out.push({
          label: "Delete",
          value: "",
          event: "handleDelete",
          icon: ALLOWED_ICONS.DELETE,
        });
      } else {
        // If it is someone else's post, you can report it
        // or give feedback on it.
        if (username.value && loggedInUserModName.value) {
          out = out.concat([
            {
              label: "Report",
              value: "",
              event: "handleClickReport",
              icon: ALLOWED_ICONS.REPORT,
            },
          ]);

          if (route.name !== "DiscussionFeedback") {
            out = out.concat([
              {
                label: "Give Feedback",
                value: "",
                event: "handleFeedback",
                icon: ALLOWED_ICONS.GIVE_FEEDBACK,
              },
            ]);
          }
        }
      }

      return out;
    });

    const authorIsAdmin = computed(() => {
      const author = props.discussion?.Author;
      const serverRoles = author?.ServerRoles || [];
      if (serverRoles.length === 0) {
        return false;
      }
      const serverRole = serverRoles[0];
      return serverRole.showAdminTag || false;
    });

    const authorIsMod = computed(() => {
      const author = props.discussion?.Author;
      const channelRoles = author?.ChannelRoles || [];
      if (channelRoles.length === 0) {
        return false;
      }
      const channelRole = channelRoles[0];
      return channelRole.showModTag || false;
    });

    return {
      authorIsAdmin,
      authorIsMod,
      copyLink,
      createdAt,
      deleteModalIsOpen,
      deleteDiscussion,
      deleteDiscussionError,
      deleteDiscussionLoading,
      editedAt,
      menuItems,
      route,
      router,
      lgAndDown,
      lgAndUp,
      mdAndDown,
      mdAndUp,
      showCopiedLinkNotification,
      showOpenIssueModal,
      showSuccessfullyReported: ref(false),
      xlAndUp,
    };
  },
  methods: {
    getFormattedDateString(startTime: string) {
      const startTimeObj = DateTime.fromISO(startTime);

      return startTimeObj.toFormat("cccc LLLL d yyyy");
    },
    handleClickGiveFeedback() {
      this.$emit("handleClickGiveFeedback");
    },
    handleClickReport() {
      this.showOpenIssueModal = true;
    },
  },
});
</script>

<template>
  <div class="mb-4">
    <div class="mt-2 flex justify-between">
      <div class="flex flex-wrap items-center space-x-2 text-xs">
        <Avatar
          :text="
            discussion && discussion.Author?.username
              ? discussion.Author.username
              : '[Deleted]'
          "
          :src="
            discussion && discussion.Author?.profilePicURL
              ? discussion.Author.profilePicURL
              : ''
          "
          :is-small="true"
        />
        <router-link
          v-if="discussion && discussion.Author"
          class="cursor-pointer font-bold text-black hover:underline dark:text-white"
          :to="`/u/${discussion.Author.username}`"
        >
          <UsernameWithTooltip
            v-if="discussion.Author.username"
            :is-admin="authorIsAdmin"
            :is-mod="authorIsMod"
            :username="discussion.Author.username"
            :src="discussion.Author.profilePicURL ?? ''"
            :display-name="discussion.Author.displayName ?? ''"
            :comment-karma="discussion.Author.commentKarma ?? 0"
            :discussion-karma="discussion.Author.discussionKarma ?? 0"
            :account-created="discussion.Author.createdAt"
          />
        </router-link>
        <span v-else>[Deleted]</span>
        <div>{{ createdAt }}</div>
        <span
          v-if="discussion && discussion.updatedAt"
          class="mx-2"
        >
          &#8226;
        </span>
        <div>{{ editedAt }}</div>
      </div>
      <MenuButton
        v-if="discussion && menuItems.length > 0"
        :items="menuItems"
        data-testid="discussion-menu-button"
        @copy-link="copyLink"
        @handle-edit="
          router.push(
            `/channels/c/${channelId}/discussions/d/${discussion.id}/edit`,
          )
        "
        @handle-delete="deleteModalIsOpen = true"
        @handle-click-report="showOpenIssueModal = true"
        @handle-feedback="handleClickGiveFeedback"
        @handle-view-feedback="
          () => {
            if (discussion) {
              router.push({
                name: 'DiscussionFeedback',
                params: {
                  discussionId: discussion.id,
                },
              });
            }
          }
        "
      >
        <EllipsisHorizontal
          class="h-6 w-6 cursor-pointer hover:text-black dark:text-gray-300 dark:hover:text-white"
        />
      </MenuButton>
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
      :open="showOpenIssueModal"
      :discussion-title="discussion?.title"
      @close="showOpenIssueModal = false"
      @report-submitted-successfully="
        () => {
          showSuccessfullyReported = true;
          showOpenIssueModal = false;
        }
      "
    />
    <Notification
      :show="showSuccessfullyReported"
      :title="'Your report was submitted successfully.'"
      @close-notification="showSuccessfullyReported = false"
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

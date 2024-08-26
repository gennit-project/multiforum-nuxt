<script lang="ts">
import { defineComponent, computed } from "vue";
import { ModerationAction } from "@/src/__generated__/graphql";
import DiscussionIcon from "../icons/DiscussionIcon.vue";
import MarkdownPreview from "../MarkdownPreview.vue";

// Enum for the allowed action types
enum ActionType {
  Close = "close",
  Comment = "comment",
  Hide = "hide",
  Remove = "remove",
  Reopen = "reopen",
  Report = "report",
  Suspend = "suspend",
  Unhide = "unhide",
  Unsuspend = "unsuspend",
}

const actionTypeToIcon = {
  [ActionType.Close]: "fa-regular fa-circle-check",
  [ActionType.Comment]: "fa-regular fa-comment",
  [ActionType.Hide]: "fa-solid fa-eye-slash",
  [ActionType.Remove]: "fa-solid fa-xmark",
  [ActionType.Reopen]: "fa-solid fa-arrows-rotate",
  [ActionType.Report]: "fa-regular fa-flag",
  [ActionType.Suspend]: "fa-solid fa-user-lock",
  [ActionType.Unhide]: "fa-solid fa-eye",
  [ActionType.Unsuspend]: "fa-solid fa-user-plus",
};

export default defineComponent({
  components: {
    DiscussionIcon,
    MarkdownPreview,
  },
  props: {
    feedItems: {
      type: Array as () => ModerationAction[],
      required: true,
    },
  },

  setup(props) {
    const reversedFeedItems = computed(() => {
      return props.feedItems.slice().reverse();
    });

    return {
      actionTypeToIcon,
      timeAgo,
      reversedFeedItems,
    };
  },
  methods: {
    getBackgroundColor(actionType: string) {
      switch (actionType) {
        case ActionType.Close:
          return "bg-purple-200 dark:bg-purple-500";
        case ActionType.Comment:
          return "bg-blue-200 dark:bg-blue-500";
        case ActionType.Remove:
          return "bg-red-200 dark:bg-red-500";
        case ActionType.Report:
          return "bg-red-200 dark:bg-red-500";
        case ActionType.Unsuspend:
          return "bg-green-200 dark:bg-green-500";
        case ActionType.Reopen:
          return "bg-green-200 dark:bg-green-500";
        default:
          return "bg-gray-200 dark:bg-gray-600";
      }
    },
  },
});
</script>

<template>
  <div class="flow-root">
    <ul
      role="list"
      class="-mb-8"
    >
      <li
        v-for="(activityItem, activityItemIdx) in reversedFeedItems"
        :key="activityItem.id"
      >
        <div class="relative pb-8">
          <span
            v-if="activityItemIdx !== feedItems.length - 1"
            class="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600"
            aria-hidden="true"
          />
          <div class="relative flex items-start space-x-3">
            <template v-if="activityItem.actionType === 'comment'">
              <div class="relative">
                <Avatar
                  v-if="activityItem.ModerationProfile?.displayName"
                  class="z-10"
                  :is-small="true"
                  :text="activityItem.ModerationProfile.displayName"
                />

                <span
                  class="absolute -bottom-0.5 -right-1 rounded-tl bg-white px-0.5 py-px dark:bg-gray-600"
                >
                  <DiscussionIcon
                    class="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex align-items gap-2">
                  <span class="text-sm">
                    <router-link
                      v-if="activityItem.ModerationProfile?.displayName"
                      :to="{
                        name: 'ModProfile',
                        params: {
                          modId: activityItem.ModerationProfile.displayName,
                        },
                      }"
                      class="font-medium text-gray-900 hover:underline dark:text-gray-200"
                    >
                      {{ activityItem.ModerationProfile?.displayName }}
                    </router-link>
                  </span>
                  <span class="text-sm text-gray-500 dark:text-gray-300">
                    Commented
                    {{ `${timeAgo(new Date(activityItem.createdAt))}` }}
                  </span>
                </div>
                <div
                  class="mt-3 border-l-2 border-gray-200 dark:border-gray-500"
                >
                  <MarkdownPreview
                    v-if="
                      activityItem.actionType === 'comment' &&
                        activityItem.Comment
                    "
                    :text="activityItem.Comment.text || ''"
                    :word-limit="1000"
                    :disable-gallery="true"
                  />
                </div>
              </div>
            </template>

            <template v-else>
              <div>
                <div class="relative px-1">
                  <div
                    v-if="activityItem.actionType"
                    class="flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white dark:text-white dark:ring-gray-800"
                    :class="[getBackgroundColor(activityItem.actionType)]"
                  >
                    <i
                      :class="[`${actionTypeToIcon[activityItem.actionType]}`]"
                    />
                  </div>
                </div>
              </div>
              <div class="min-w-0 flex-1 py-0">
                <div class="text-sm leading-8 text-gray-500 dark:text-gray-300">
                  <span class="mr-0.5">
                    <router-link
                      v-if="activityItem.ModerationProfile?.displayName"
                      :to="{
                        name: 'ModProfile',
                        params: {
                          modId: activityItem.ModerationProfile.displayName,
                        },
                      }"
                      class="font-medium text-gray-900 hover:underline dark:text-gray-200"
                    >{{
                      activityItem.ModerationProfile?.displayName
                    }}</router-link>
                    {{ activityItem.actionDescription }}
                  </span>
                  {{ " " }}

                  <span class="whitespace-nowrap">{{
                    `${timeAgo(new Date(activityItem.createdAt))}`
                  }}</span>
                </div>

                <div class="border-l-2 border-gray-200 dark:border-gray-500">
                  <MarkdownPreview
                    v-if="
                      activityItem.actionType === 'report' &&
                        activityItem.Comment
                    "
                    :text="activityItem.Comment.text || ''"
                    :word-limit="1000"
                    :disable-gallery="true"
                  />
                </div>
              </div>
            </template>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

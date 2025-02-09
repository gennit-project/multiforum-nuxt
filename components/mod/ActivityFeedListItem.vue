<script lang="ts" setup>
import DiscussionIcon from "@/components/icons/DiscussionIcon.vue";
import MarkdownPreview from "../MarkdownPreview.vue";
import type { PropType } from "vue";
import { timeAgo } from "@/utils";
import type { ModerationAction } from "@/__generated__/graphql";
import { useRoute } from "nuxt/app";
import ArchiveBox from "../icons/ArchiveBox.vue";
import ArchiveBoxXMark from "../icons/ArchiveBoxXMark.vue";
import CheckCircle from "../icons/CheckCircle.vue";
import ChatBubbleBottomCenter from "../icons/ChatBubbleBottomCenter.vue";
import XmarkIcon from "../icons/XmarkIcon.vue";
import UserPlus from "../icons/UserPlus.vue";
import UserMinus from "../icons/UserMinus.vue";
import ArrowPath from "../icons/ArrowPath.vue";
import FlagIcon from "../icons/FlagIcon.vue";
import { ActionType } from "@/types/Comment";

const getBackgroundColor = (actionType: string) => {
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
    case ActionType.Archive:
      return "bg-yellow-200 dark:bg-red-500";
    case ActionType.Unarchive:
      return "bg-green-200 dark:bg-green-500";
    default:
      return "bg-gray-200 dark:bg-gray-600";
  }
};

const actionTypeToIcon = {
  [ActionType.Close]: CheckCircle,
  [ActionType.Comment]: ChatBubbleBottomCenter,
  [ActionType.Remove]: XmarkIcon,
  [ActionType.Reopen]: ArrowPath,
  [ActionType.Report]: FlagIcon,
  [ActionType.Suspend]: UserMinus,
  [ActionType.Unsuspend]: UserPlus,
  [ActionType.Archive]: ArchiveBox,
  [ActionType.Unarchive]: ArchiveBoxXMark,
};

const props = defineProps({
  activityItem: {
    type: Object as PropType<ModerationAction>,
    required: true,
  },
});

const commentIdInParams = useRoute().params.commentId as string;
</script>

<template>
  <li class="list-none">
    <div class="relative pb-8">
      <span
        class="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600"
        aria-hidden="true"
      />
      <div class="relative flex items-start space-x-3">
        <template v-if="activityItem.actionType === 'comment'">
          <div class="relative">
            <AvatarComponent
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
                <nuxt-link
                  v-if="activityItem.ModerationProfile?.displayName"
                  :to="{
                    name: 'mod-modId',
                    params: {
                      modId: activityItem.ModerationProfile.displayName,
                    },
                  }"
                  class="font-medium text-gray-900 hover:underline dark:text-gray-200"
                >
                  {{ activityItem.ModerationProfile?.displayName }}
                </nuxt-link>
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-300">
                Commented
                {{ `${timeAgo(new Date(activityItem.createdAt))}` }}
              </span>
              <span
                v-if="activityItem?.Comment?.id === commentIdInParams"
                class="rounded-lg text-xs bg-blue-500 px-2 py-1 text-black"
                >Permalinked
              </span>
            </div>
            <div class="mt-3 border-l-2 border-gray-200 dark:border-gray-500">
              <MarkdownPreview
                v-if="
                  activityItem.actionType === 'comment' && activityItem.Comment
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
                <component
                  :is="actionTypeToIcon[activityItem.actionType as ActionType]"
                  class="h-5 w-5 text-black"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
          <div class="min-w-0 flex-1 py-0">
            <div class="text-sm leading-8 text-gray-500 dark:text-gray-300">
              <span class="mr-0.5">
                <nuxt-link
                  v-if="activityItem.ModerationProfile?.displayName"
                  :to="{
                    name: 'mod-modId',
                    params: {
                      modId: activityItem.ModerationProfile.displayName,
                    },
                  }"
                  class="font-medium text-gray-900 hover:underline dark:text-gray-200"
                  >{{ activityItem.ModerationProfile?.displayName }}</nuxt-link
                >
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
                  activityItem.actionType === 'report' && activityItem.Comment
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
</template>

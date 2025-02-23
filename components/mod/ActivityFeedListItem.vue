<script lang="ts" setup>
import MarkdownPreview from "../MarkdownPreview.vue";
import type { PropType } from "vue";
import { timeAgo } from "@/utils";
import type { ModerationAction } from "@/__generated__/graphql";
import { useRoute } from "nuxt/app";
import ArchiveBox from "../icons/ArchiveBox.vue";
import ArchiveBoxXMark from "../icons/ArchiveBoxXMark.vue";
import ChatBubbleBottomCenter from "../icons/ChatBubbleBottomCenter.vue";
import XmarkIcon from "../icons/XmarkIcon.vue";
import UserPlus from "../icons/UserPlus.vue";
import UserMinus from "../icons/UserMinus.vue";
import ArrowPath from "../icons/ArrowPath.vue";
import FlagIcon from "../icons/FlagIcon.vue";
import XCircleIcon from "../icons/XCircleIcon.vue";
import { ActionType } from "@/types/Comment";

const actionTypeToIcon = {
  [ActionType.Close]: XCircleIcon,
  [ActionType.Comment]: ChatBubbleBottomCenter,
  [ActionType.Remove]: XmarkIcon,
  [ActionType.Reopen]: ArrowPath,
  [ActionType.Report]: FlagIcon,
  [ActionType.Suspension]: UserMinus,
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
const isPermalinked = commentIdInParams && commentIdInParams === props.activityItem.Comment?.id;
</script>

<template>
  <li
    class="list-none mt-4"
    :class="[
      isPermalinked
        ? 'bg-blue-100 rounded-lg border border-blue-500 dark:bg-blue-900'
        : '',
    ]"
  >
    <div class="relative">
      <span
        class="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600"
        aria-hidden="true"
      />
      <div class="relative flex items-start space-x-3">
        <div>
          <div class="relative px-1">
            <div
              v-if="activityItem.actionType"
              class="flex h-8 w-8 items-center bg-gray-500 justify-center rounded-full ring-8 ring-white dark:text-white dark:ring-gray-800"
            >
              <component
                :is="actionTypeToIcon[activityItem.actionType as ActionType]"
                class="h-5 w-5 text-white"
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
                class="font-medium text-gray-900 hover:underline dark:text-gray-200 flex items-center gap-1"
                ><AvatarComponent
                  :text="activityItem.ModerationProfile?.displayName"
                  :is-small="true"
                />{{ activityItem.ModerationProfile?.displayName }}</nuxt-link
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
              v-if="activityItem.Comment"
              :text="activityItem.Comment.text || ''"
              :word-limit="1000"
              :disable-gallery="true"
            />
          </div>
        </div>
      </div>
    </div>
  </li>
</template>

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
  isOriginalPoster: {
    type: Boolean,
    default: false,
  },
});
const commentIdInParams = useRoute().params.commentId as string;
const isPermalinked =
  commentIdInParams && commentIdInParams === props.activityItem.Comment?.id;
</script>

<template>
  <li
<<<<<<< HEAD
    class="mt-4 list-none"
    :class="[
      isPermalinked ? 'rounded-lg border border-orange-500 bg-orange-100 dark:bg-orange-900' : '',
=======
    class="list-none mt-4"
    :class="[
      isPermalinked
        ? 'bg-blue-100 rounded-lg border border-blue-500 dark:bg-blue-900'
        : '',
>>>>>>> parent of 666ae3d (Use automated formatting tools)
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
          <div class="text-xs leading-8 text-gray-500 dark:text-gray-300">
            <span class="mr-0.5 flex flex-row items-center gap-1">
              <!-- Link for ModerationProfile -->
              <AvatarComponent
                v-if="activityItem.ModerationProfile?.displayName"
                :text="activityItem.ModerationProfile?.displayName"
                :is-small="true"
              />
              <nuxt-link
                v-if="activityItem.ModerationProfile?.displayName"
                :to="{
                  name: isOriginalPoster ? 'u-username' : 'mod-modId',
                  params: {
                    [isOriginalPoster ? 'username' : 'modId']:
                      activityItem.ModerationProfile.displayName,
                  },
                }"
                class="font-medium text-gray-900 hover:underline dark:text-gray-200 flex items-center gap-1"
              >
                <span class="flex flex-row items-center gap-1">
                  {{ activityItem.ModerationProfile?.displayName }}
                  <span
                    v-if="isOriginalPoster"
<<<<<<< HEAD
                    class="rounded-md border border-gray-300 px-1 py-0 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300"
=======
                    class="rounded-md border border-gray-500 dark:border-gray-300 px-1 py-0 text-xs text-gray-500 dark:text-gray-300"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
                    >OP</span
                  >
                </span>
              </nuxt-link>

              <!-- Link for User -->
              <AvatarComponent
                v-if="activityItem.User?.username"
                :text="activityItem.User.username"
                :is-small="true"
              />
              <nuxt-link
                v-if="activityItem.User?.username"
                :to="{
                  name: 'u-username',
                  params: {
                    username: activityItem.User.username,
                  },
                }"
                class="font-medium text-gray-900 hover:underline dark:text-gray-200 flex items-center gap-1"
              >
                <span class="flex items-center gap-1">
                  {{ activityItem.User.username }}
                  <span
                    v-if="isOriginalPoster"
<<<<<<< HEAD
                    class="rounded-md border border-gray-300 px-1 text-xs text-gray-500 dark:border-gray-300 dark:text-gray-300"
=======
                    class="rounded-md border border-gray-500 dark:border-gray-300 px-1 text-xs text-gray-500 dark:text-gray-300"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
                    >OP</span
                  >
                </span>
              </nuxt-link>
              {{ activityItem.actionDescription }}
            </span>
            {{ " " }}

            <span class="whitespace-nowrap">{{
              `${timeAgo(new Date(activityItem.createdAt))}`
            }}</span>
          </div>

<<<<<<< HEAD
          <div class="border-l-2 border-gray-300 pl-2 dark:border-gray-300">
=======
          <div class="border-l-2 border-gray-200 dark:border-gray-500 pl-2">
>>>>>>> parent of 666ae3d (Use automated formatting tools)
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

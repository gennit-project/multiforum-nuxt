<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { Comment, User, ModerationProfile } from '@/__generated__/graphql'
import UsernameWithTooltip from '../UsernameWithTooltip.vue'
import { relativeTime } from '@/utils'

// Props definition using defineProps
const props = defineProps({
  commentData: {
    type: Object as PropType<Comment>,
    required: true,
  },
  isHighlighted: {
    type: Boolean,
    default: false,
  },
  parentCommentId: {
    type: String,
    default: '',
  },
  showContextLink: {
    type: Boolean,
    default: true,
  },
  showChannel: {
    type: Boolean,
    default: false,
  },
  originalPoster: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
})
const isAdmin = computed(() => {
  const author: User | ModerationProfile | undefined | null = props.commentData.CommentAuthor
  if (!author) {
    return false
  }
  if (author.__typename === 'User') {
    const serverRoles = author.ServerRoles
    if (!serverRoles || serverRoles.length === 0) {
      return false
    }
    return serverRoles[0].showAdminTag
  }
  return false
})

const isMod = computed(() => {
  const author: User | ModerationProfile | undefined | null = props.commentData.CommentAuthor
  if (!author) {
    return false
  }
  if (author.__typename === 'User') {
    const channelRoles = author.ChannelRoles
    if (!channelRoles || channelRoles.length === 0) {
      return false
    }
    return channelRoles[0].showModTag
  }
  return false
})

const commentAuthorUsername = computed(() => props.commentData.CommentAuthor?.username)
const commentAuthorProfilePic = computed(() => props.commentData.CommentAuthor?.profilePicURL)
const commentAuthorDisplayName = computed(() => props.commentData.CommentAuthor?.displayName)
const commentKarma = computed(() => props.commentData.CommentAuthor?.commentKarma ?? 0)
const discussionKarma = computed(() => props.commentData.CommentAuthor?.discussionKarma ?? 0)
const commentAuthorAge = computed(() => props.commentData.CommentAuthor?.createdAt)
const createdAt = computed(() => props.commentData.createdAt)

const createdAtFormatted = computed(() => {
  if (!props.commentData.createdAt) {
    return ''
  }
  return `posted ${relativeTime(props.commentData.createdAt)}${
    props.showChannel
      ? ' in c/' +
        (props.commentData.DiscussionChannel?.channelUniqueName ||
          props.commentData.Event?.EventChannels[0]?.channelUniqueName ||
          props.commentData.Channel?.uniqueName ||
          '')
      : ''
  }`
})

const editedAtFormatted = computed(() => {
  if (!props.commentData.updatedAt) {
    return ''
  }
  return `Edited ${relativeTime(props.commentData.updatedAt)}`
})
</script>

<template>
  <div class="flex w-full">
    <p v-if="!commentData">[Deleted]</p>
    <AvatarComponent
      v-else-if="commentAuthorUsername"
      class="z-10"
      :is-small="true"
      :text="commentAuthorUsername"
      :src="commentAuthorProfilePic || ''"
    />
    <AvatarComponent
      v-else-if="commentData.CommentAuthor?.displayName"
      class="z-10"
      :is-small="true"
      :text="commentData.CommentAuthor.displayName"
    />

    <div
      :class="!commentAuthorUsername ? '-ml-5' : '-ml-4 border-l'"
      class="flex-grow border-gray-300 pl-4 dark:border-gray-600"
    >
      <div
        v-if="showContextLink && parentCommentId && commentData.DiscussionChannel"
      >
        <NuxtLink
          class="px-2 text-xs underline"
          :to="{
            name: 'forums-forumId-discussions-discussionId-comments-commentId',
            params: {
              discussionId: commentData.DiscussionChannel.discussionId,
              commentId: parentCommentId,
              forumId: commentData.DiscussionChannel.channelUniqueName,
            },
          }"
        >
          View Context
        </NuxtLink>
      </div>
      <div class="mt-2 flex flex-wrap items-center">
        <div class="ml-1 flex flex-wrap items-center space-x-2 text-xs dark:text-gray-300">
          <NuxtLink
            v-if="commentAuthorUsername"
            class="mx-1 font-bold hover:underline dark:text-gray-200"
            :to="{
              name: 'u-username',
              params: { username: commentAuthorUsername },
            }"
          >
            <UsernameWithTooltip
              v-if="commentAuthorUsername"
              :username="commentAuthorUsername"
              :src="commentAuthorProfilePic || ''"
              :display-name="commentAuthorDisplayName || ''"
              :comment-karma="commentKarma"
              :discussion-karma="discussionKarma"
              :account-created="commentAuthorAge"
              :is-admin="isAdmin"
              :is-mod="isMod"
              :is-original-poster="commentAuthorUsername === originalPoster"
            />
          </NuxtLink>
          <NuxtLink
            v-else-if="commentData.CommentAuthor?.displayName"
            class="mx-1 font-bold hover:underline dark:text-gray-200"
            :to="{
              name: 'u-username',
              params: { username: commentData.CommentAuthor.displayName },
            }"
          >
            {{ commentData.CommentAuthor.displayName }}
          </NuxtLink>
          <span v-else class="flex items-center font-bold">
            <div class="mr-2 h-8 w-8 rounded-full border dark:border-gray-500" />
            [Deleted]
          </span>
          <span class="mx-2">&middot;</span>
          <span>{{ createdAtFormatted }}</span>
          <span v-if="commentData.updatedAt" class="mx-2">&middot;</span>
          <span>{{ editedAtFormatted }}</span>
          <span
            v-if="isHighlighted"
            class="rounded-lg bg-blue-500 px-2 py-1 text-black"
          >
            Permalinked
          </span>
          <span
            v-if="label"
            class="rounded-lg border border-blue-500 px-2 py-1 text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900"
          >
            {{ label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
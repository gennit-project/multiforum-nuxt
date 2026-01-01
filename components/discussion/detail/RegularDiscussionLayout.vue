<script lang="ts" setup>
import { computed, defineAsyncComponent } from 'vue';
import type { Discussion, DiscussionChannel } from '@/__generated__/graphql';
import DiscussionBody from '@/components/discussion/detail/DiscussionBody.vue';
import DiscussionVotes from '@/components/discussion/vote/DiscussionVotes.vue';
import MarkAsAnsweredButton from '@/components/discussion/detail/MarkAsAnsweredButton.vue';
import DiscussionTitleVersions from '@/components/discussion/detail/activityFeed/DiscussionTitleVersions.vue';
import { usernameVar } from '@/cache';
import CrosspostedDiscussionEmbed from '@/components/discussion/detail/CrosspostedDiscussionEmbed.vue';

const DiscussionAlbum = defineAsyncComponent(
  () => import('@/components/discussion/detail/DiscussionAlbum.vue')
);

const props = defineProps({
  discussion: {
    type: Object as () => Discussion,
    required: true,
  },
  discussionId: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  activeDiscussionChannel: {
    type: Object as () => DiscussionChannel | null,
    default: null,
  },
});

const emit = defineEmits<{
  discussionRefetch: [];
  discussionChannelRefetch: [];
  editAlbum: [];
  handleClickEditFeedback: [];
  handleClickGiveFeedback: [];
  handleClickUndoFeedback: [];
}>();

const loggedInUserIsAuthor = computed(() => {
  return props.discussion?.Author?.username === usernameVar.value;
});

const stlFiles = computed(() => {
  if (!props.discussion?.DownloadableFiles) return [];

  return props.discussion.DownloadableFiles.filter(
    (file) =>
      file.fileName?.toLowerCase().endsWith('.stl') ||
      file.url?.toLowerCase().endsWith('.stl')
  );
});

const hasAlbum = computed(() => {
  const hasImages =
    props.discussion?.Album?.Images && props.discussion.Album.Images.length > 0;
  const hasStlFiles = stlFiles.value.length > 0;

  return hasImages || hasStlFiles;
});
</script>

<template>
  <div class="space-y-4">
    <CrosspostedDiscussionEmbed
      v-if="discussion?.CrosspostedDiscussion"
      :discussion="discussion.CrosspostedDiscussion"
    />
    <DiscussionBody
      :key="`discussion-body-${discussion?.id}-${discussion?.hasSensitiveContent}`"
      :channel-id="channelId"
      :discussion="discussion"
      :discussion-channel-id="activeDiscussionChannel?.id"
      :download-mode="false"
      :emoji-json="activeDiscussionChannel?.emoji"
      :show-emoji-button="true"
    >
      <template #album-slot>
        <div
          class="mt-1 w-full min-w-0 overflow-hidden rounded-lg bg-black text-white"
        >
          <DiscussionAlbum
            v-if="hasAlbum"
            :album="discussion?.Album || null"
            :carousel-format="true"
            :expanded-view="true"
            :download-mode="false"
            :discussion-author="discussion.Author?.username || ''"
            :discussion-id="discussionId"
            :stl-files="stlFiles"
            @album-updated="emit('discussionRefetch')"
            @edit-album="emit('editAlbum')"
          />
        </div>
      </template>
      <template #activity-feed-slot>
        <DiscussionTitleVersions
          v-if="
            discussion?.PastTitleVersions &&
            discussion.PastTitleVersions.length > 0
          "
          :discussion="discussion"
        />
      </template>
      <template #mark-answered-slot>
        <MarkAsAnsweredButton
          v-if="loggedInUserIsAuthor"
          :answered="activeDiscussionChannel?.answered || false"
          :channel-id="channelId"
          :discussion-channel-id="activeDiscussionChannel?.id"
          :discussion-id="discussionId"
          @mark-unanswered="emit('discussionChannelRefetch')"
        />
      </template>
      <template #button-slot>
        <div class="flex-col items-center">
          <DiscussionVotes
            v-if="activeDiscussionChannel"
            :discussion="discussion"
            :discussion-channel="activeDiscussionChannel"
            :show-emoji-button="true"
            :show-downvote="
              !loggedInUserIsAuthor &&
              (activeDiscussionChannel?.Channel?.feedbackEnabled ?? true)
            "
            :use-heart-icon="false"
            @handle-click-edit-feedback="emit('handleClickEditFeedback')"
            @handle-click-give-feedback="emit('handleClickGiveFeedback')"
            @handle-click-undo-feedback="emit('handleClickUndoFeedback')"
          />
        </div>
      </template>
    </DiscussionBody>
  </div>
</template>

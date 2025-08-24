<script lang="ts" setup>
import type { Discussion, DiscussionChannel } from '@/__generated__/graphql';
import DownloadModeLayout from './DownloadModeLayout.vue';
import RegularDiscussionLayout from './RegularDiscussionLayout.vue';
import DownloadTabNavigation from './DownloadTabNavigation.vue';

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
  downloadMode: {
    type: Boolean,
    default: false,
  },
  aggregateCommentCount: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits<{
  discussionRefetch: [];
  discussionChannelRefetch: [];
  handleClickAddAlbum: [];
  editAlbum: [];
  handleClickEditFeedback: [];
  handleClickGiveFeedback: [];
  handleClickUndoFeedback: [];
}>();
</script>

<template>
  <div>
    <!-- Download mode layout with sidebar -->
    <DownloadModeLayout
      v-if="downloadMode"
      :discussion="discussion"
      :discussion-id="discussionId"
      :channel-id="channelId"
      :active-discussion-channel="activeDiscussionChannel"
      @discussion-refetch="emit('discussionRefetch')"
      @discussion-channel-refetch="emit('discussionChannelRefetch')"
      @handle-click-add-album="emit('handleClickAddAlbum')"
      @edit-album="emit('editAlbum')"
      @handle-click-edit-feedback="emit('handleClickEditFeedback')"
      @handle-click-give-feedback="emit('handleClickGiveFeedback')"
      @handle-click-undo-feedback="emit('handleClickUndoFeedback')"
    />
    
    <!-- Regular discussion mode layout -->
    <RegularDiscussionLayout
      v-else
      :discussion="discussion"
      :discussion-id="discussionId"
      :channel-id="channelId"
      :active-discussion-channel="activeDiscussionChannel"
      @discussion-refetch="emit('discussionRefetch')"
      @discussion-channel-refetch="emit('discussionChannelRefetch')"
      @edit-album="emit('editAlbum')"
      @handle-click-edit-feedback="emit('handleClickEditFeedback')"
      @handle-click-give-feedback="emit('handleClickGiveFeedback')"
      @handle-click-undo-feedback="emit('handleClickUndoFeedback')"
    />

    <!-- Download mode tabs (only shown in download mode) -->
    <DownloadTabNavigation
      v-if="downloadMode"
      :discussion="discussion"
      :discussion-id="discussionId"
      :channel-id="channelId"
      :aggregate-comment-count="aggregateCommentCount"
    />
  </div>
</template>
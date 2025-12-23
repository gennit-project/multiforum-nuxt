<script lang="ts" setup>
import { computed, defineAsyncComponent } from 'vue';
import type { Discussion, DiscussionChannel } from '@/__generated__/graphql';
import DiscussionBody from '@/components/discussion/detail/DiscussionBody.vue';
import DiscussionVotes from '@/components/discussion/vote/DiscussionVotes.vue';
import MarkAsAnsweredButton from '@/components/discussion/detail/MarkAsAnsweredButton.vue';
import DownloadSidebar from '@/components/channel/DownloadSidebar.vue';
import ImageIcon from '@/components/icons/ImageIcon.vue';
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
  handleClickAddAlbum: [];
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
  <div class="flex flex-col gap-4 lg:flex-row lg:gap-6">
    <div class="flex-1 space-y-4">
      <CrosspostedDiscussionEmbed
        v-if="discussion?.CrosspostedDiscussion"
        :discussion="discussion.CrosspostedDiscussion"
      />
      <DiscussionBody
        :key="`discussion-body-${discussion?.id}-${discussion?.hasSensitiveContent}`"
        :channel-id="channelId"
        :discussion="discussion"
        :discussion-channel-id="activeDiscussionChannel?.id"
        :download-mode="true"
        :emoji-json="activeDiscussionChannel?.emoji"
        :show-emoji-button="false"
      >
        <template #album-slot>
          <div class="mt-1 bg-black text-white">
            <DiscussionAlbum
              v-if="hasAlbum"
              :album="discussion?.Album || null"
              :carousel-format="true"
              :expanded-view="true"
              :download-mode="true"
              :discussion-author="discussion.Author?.username || ''"
              :discussion-id="discussionId"
              :stl-files="stlFiles"
              @album-updated="emit('discussionRefetch')"
              @edit-album="emit('editAlbum')"
            />
            <div
              v-else
              class="flex h-48 w-full items-center justify-center border border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
            >
              <div class="flex flex-col items-center space-y-3">
                <span v-if="!loggedInUserIsAuthor">No images available.</span>
                <button
                  v-if="loggedInUserIsAuthor && usernameVar"
                  class="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-700"
                  data-testid="add-album-button"
                  @click="emit('handleClickAddAlbum')"
                >
                  <ImageIcon class="h-5 w-5" />
                  <span>Add Images</span>
                </button>
              </div>
            </div>
          </div>
        </template>
        <template #activity-feed-slot>
          <!-- Title Edit History moved to Description tab for downloads -->
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
              :show-emoji-button="false"
              :show-downvote="
                !loggedInUserIsAuthor &&
                (activeDiscussionChannel?.Channel?.feedbackEnabled ?? true)
              "
              :use-heart-icon="true"
              @handle-click-edit-feedback="emit('handleClickEditFeedback')"
              @handle-click-give-feedback="emit('handleClickGiveFeedback')"
              @handle-click-undo-feedback="emit('handleClickUndoFeedback')"
            />
          </div>
        </template>
      </DiscussionBody>
    </div>
    <div class="flex-shrink-0">
      <DownloadSidebar 
        v-if="discussion && activeDiscussionChannel" 
        :discussion="discussion" 
        :discussion-id="discussionId"
        :channel-unique-name="activeDiscussionChannel.channelUniqueName"
      />
    </div>
  </div>
</template>

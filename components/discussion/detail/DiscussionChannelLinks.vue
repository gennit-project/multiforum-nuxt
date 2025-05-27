<script lang="ts">
import type { PropType } from "vue";
import { defineComponent, computed } from "vue";
import DiscussionChannelLink from "./DiscussionChannelLink.vue";
import { useRoute } from "nuxt/app";
import type { DiscussionChannel } from "@/__generated__/graphql";

export default defineComponent({
  name: "DiscussionChannelLinks",
  components: {
    DiscussionChannelLink,
  },
  props: {
    channelId: {
      type: String,
      required: false,
      default: ''
    },
    discussionChannels: {
      type: Array as PropType<Array<DiscussionChannel>>,
      required: true,
    },
  },
  setup(props) {
    const route = useRoute();

    const getCommentCount = (channelId: string) => {
      const discussionChannels = props.discussionChannels;

      const activeDiscussionChannel = discussionChannels.find((cs: any) => {
        return cs.Channel?.uniqueName === channelId;
      });

      if (!activeDiscussionChannel) {
        return 0;
      }
      return activeDiscussionChannel.CommentsAggregate?.count
        ? activeDiscussionChannel.CommentsAggregate.count
        : 0;
    };

    const getVoteCount = (channelId: string) => {
      const discussionChannels = props.discussionChannels;

      const activeDiscussionChannel = discussionChannels.find(
        (dc: DiscussionChannel) => {
          return dc.channelUniqueName === channelId;
        },
      );

      if (!activeDiscussionChannel || !activeDiscussionChannel.UpvotedByUsersAggregate?.count) {
        return 0;
      }
      return activeDiscussionChannel.UpvotedByUsersAggregate.count;
    };

    const activeDiscussionChannel = computed(() => {
      return props.discussionChannels.filter((dc) => {
            return  dc.channelUniqueName === props.channelId;
          })[0]
    })

    const channelsExceptActive = computed(() => {
      return props.discussionChannels.filter((dc) => {
        return dc.channelUniqueName !== props.channelId;
      });
    });

    
    return {
      activeDiscussionChannel,
      channelsExceptActive,
      route,
      getCommentCount,
      getVoteCount
    };
  },
});
</script>

<template>
  <div class="px-3 dark:text-white">
    <div
      v-if="!channelId"
      class="my-4"
    >
      <h2 class="text-lg">
        Comments in Forums
      </h2>

      <ul class="list-disc pl-3">
        <DiscussionChannelLink
          v-for="discussionChannel in discussionChannels"
          :key="discussionChannel.id"
          :channel-id="discussionChannel.channelUniqueName"
          :channel-icon="discussionChannel.Channel?.channelIconURL || ''"
          :channel-display-name="discussionChannel.Channel?.displayName || ''"
          :comment-count="discussionChannel.CommentsAggregate?.count || 0"
          :upvote-count="discussionChannel.UpvotedByUsersAggregate?.count || 0"
          :discussion-id="discussionChannel.discussionId"
        />
      </ul>
    </div>


    <div v-if="channelId && channelsExceptActive.length > 0">
      <div>
        <h2 class="mt-4 text-lg">
          Comments in Other Forums
        </h2>
        <ul class="list-disc pl-4">
          <DiscussionChannelLink
            v-for="dc in channelsExceptActive"
            :key="dc.id"
            :channel-id="dc.channelUniqueName"
            :channel-icon="dc.Channel?.channelIconURL || ''"
            :channel-display-name="dc.Channel?.displayName || ''"
            :comment-count="dc.CommentsAggregate?.count || 0"
            :upvote-count="dc.UpvotedByUsersAggregate?.count || 0"
            :discussion-id="dc.discussionId"
          />
        </ul>
        <p
          v-if="channelsExceptActive.length === 0"
          class="text-sm"
        >
          The post was not submitted to any other channels.
        </p>
      </div>
    </div>
  </div>
</template>

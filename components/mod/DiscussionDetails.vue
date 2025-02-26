<script lang="ts">
import { defineComponent, computed } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_DISCUSSION } from "@/graphQLData/discussion/queries";
import ErrorBanner from "@/components/ErrorBanner.vue";
import type { Issue } from "@/__generated__/graphql";
import { DateTime } from "luxon";
import MarkdownPreview from "../MarkdownPreview.vue";
import { useRoute } from "nuxt/app";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { modProfileNameVar } from "@/cache";

export default defineComponent({
  components: {
    ErrorBanner,
    LoadingSpinner,
    MarkdownPreview,
  },
  props: {
    activeIssue: {
      type: Object as () => Issue,
      required: true,
    },
  },
  setup(props) {
    const route = useRoute();

    const discussionId = computed(() => {
      return props.activeIssue.relatedDiscussionId;
    });

    const channelId = computed(() => {
      if (typeof route.params.forumId === "string") {
        return route.params.forumId;
      }
      return "";
    });

    const {
      result: getDiscussionResult,
      error: getDiscussionError,
      loading: getDiscussionLoading,
    } = useQuery(GET_DISCUSSION, {
      id: discussionId,
      loggedInModName: modProfileNameVar.value,
      channelUniqueName: channelId.value,
    });

    const discussion = computed(() => {
      if (getDiscussionLoading.value || getDiscussionError.value) {
        return null;
      }
      return getDiscussionResult.value.discussions[0];
    });

    return {
      channelId,
      discussion,
      getDiscussionError,
      getDiscussionLoading,
    };
  },
  methods: {
    formatDate(date: string) {
      return DateTime.fromISO(date).toLocaleString(DateTime.DATE_FULL);
    },
  },
});
</script>

<template>
  <div>
    <ErrorBanner v-if="getDiscussionError" :text="getDiscussionError.message" />
    <LoadingSpinner v-else-if="getDiscussionLoading" />
    <div v-if="discussion" class="mt-3 flex w-full flex-col gap-2">
      <nuxt-link
        :to="{
          name: 'u-username',
          params: { username: discussion?.Author?.username },
        }"
        class="flex items-center dark:text-white"
      > 
        <AvatarComponent
          :text="discussion?.Author.username"
          :src="discussion?.Author.profilePicURL ?? ''"
          class="mr-2 h-6 w-6"
        />
        <UsernameWithTooltip
          v-if="discussion?.Author?.username"
          :username="discussion?.Author?.username"
          :src="discussion?.Author.profilePicURL ?? ''"
          :display-name="discussion?.Author.displayName ?? ''"
          :comment-karma="discussion?.Author.commentKarma ?? 0"
          :discussion-karma="discussion?.Author.discussionKarma ?? 0"
          :account-created="discussion?.Author.createdAt ?? ''"
        /> 
        <span class="ml-1">posted on {{ formatDate(discussion.createdAt) }}</span>
      </nuxt-link>
      <div class="border-l border-l-2 pl-6">
        <h3 v-if="discussion?.title">
          <nuxt-link
            :to="{
              name: 'forums-forumId-discussions-discussionId',
              params: {
                forumId: channelId,
                discussionId: discussion.id,
              },
            }"
            class="text-blue-500 dark:text-blue-400"
            rel="noopener noreferrer"
          >
            {{ discussion.title }}
          </nuxt-link>
        </h3>
        <MarkdownPreview
          v-if="discussion?.body"
          class="-ml-6 max-w-none"
          :text="discussion.body"
          :disable-gallery="true"
          :word-limit="1000"
        />
      </div>
    </div>
  </div>
</template>

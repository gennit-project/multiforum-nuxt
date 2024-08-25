<script lang="ts">
import { defineComponent, computed } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_DISCUSSION } from "@/graphQLData/discussion/queries";
import ErrorBanner from "@/components/ErrorBanner.vue";
import { Issue } from "@/__generated__/graphql";
import LoadingSpinner from "../LoadingSpinner.vue";
import { DateTime } from "luxon";
import MarkdownPreview from "../MarkdownPreview.vue";
import { useRoute } from "vue-router";

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
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });

    const {
      result: getDiscussionResult,
      error: getDiscussionError,
      loading: getDiscussionLoading,
    } = useQuery(GET_DISCUSSION, { 
      id: discussionId, 
      loggedInModName: "placeholder",
      channelUniqueName: channelId.value
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
    <ErrorBanner
      v-if="getDiscussionError"
      :text="getDiscussionError.message"
    />
    <LoadingSpinner v-else-if="getDiscussionLoading" />
    <div
      v-if="discussion"
      class="mt-3 flex w-full flex-col gap-2"
    >
      <p>This is the original discussion:</p>
      <div class="border-l border-l-2 pl-6">
        <h3 v-if="discussion?.title">
          <router-link
            :to="`/channels/c/${channelId}/discussions/d/${discussion.id}`"
            class="text-blue-500 dark:text-blue-400"
            rel="noopener noreferrer"
          >
            {{ discussion.title }}
          </router-link>
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

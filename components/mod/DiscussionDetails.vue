<script setup lang="ts">
  import { computed } from "vue";
  import { useQuery } from "@vue/apollo-composable";
  import { GET_DISCUSSION } from "@/graphQLData/discussion/queries";
  import { DateTime } from "luxon";
  import { useRoute } from "nuxt/app";
  import { modProfileNameVar } from "@/cache";
  import type { Issue } from "@/__generated__/graphql";

  /* component imports that were previously declared in `components:`.
   Adjust the paths if yours are different. */
  import ErrorBanner from "@/components/ErrorBanner.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import MarkdownPreview from "../MarkdownPreview.vue";
  import AvatarComponent from "@/components/AvatarComponent.vue";
  import UsernameWithTooltip from "@/components/UsernameWithTooltip.vue";

  const props = defineProps<{
    activeIssue: Issue;
  }>();

  const emit = defineEmits(["fetchedOriginalAuthorUsername"]);

  /* ---------- route & variable helpers ---------- */
  const route = useRoute();

  const discussionId = computed(() => props.activeIssue.relatedDiscussionId);

  const channelId = computed(() =>
    typeof route.params.forumId === "string" ? route.params.forumId : ""
  );

  /* ---------- GraphQL query ---------- */
  const {
    result: getDiscussionResult,
    error: getDiscussionError,
    loading: getDiscussionLoading,
    onResult: onGetDiscussionResult,
  } = useQuery(GET_DISCUSSION, () => ({
    id: discussionId.value,
    loggedInModName: modProfileNameVar.value,
    channelUniqueName: channelId.value,
  }));

  const discussion = computed(() => {
    if (getDiscussionLoading.value || getDiscussionError.value) return null;
    return getDiscussionResult.value?.discussions?.[0] ?? null;
  });

  onGetDiscussionResult(({ data }) => {
    if (data?.discussions?.length) {
      const originalAuthorUsername = data.discussions[0].Author.username;
      emit("fetchedOriginalAuthorUsername", originalAuthorUsername);
    }
  });

  /* ---------- utilities ---------- */
  const formatDate = (iso: string) => DateTime.fromISO(iso).toLocaleString(DateTime.DATE_FULL);
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
      <nuxt-link
        class="flex items-center dark:text-white"
        :to="{ name: 'u-username', params: { username: discussion?.Author?.username } }"
      >
        <AvatarComponent
          class="mr-2 h-6 w-6"
          :src="discussion?.Author.profilePicURL ?? ''"
          :text="discussion?.Author.username"
        />
        <UsernameWithTooltip
          v-if="discussion?.Author?.username"
          :account-created="discussion?.Author.createdAt ?? ''"
          :comment-karma="discussion?.Author.commentKarma ?? 0"
          :discussion-karma="discussion?.Author.discussionKarma ?? 0"
          :display-name="discussion?.Author.displayName ?? ''"
          :src="discussion?.Author.profilePicURL ?? ''"
          :username="discussion?.Author?.username"
        />
        <span class="ml-1">posted on {{ formatDate(discussion.createdAt) }}</span>
      </nuxt-link>

      <div class="border-l border-l-2 pl-6">
        <h3 v-if="discussion?.title">
          <nuxt-link
            class="text-orange-500 dark:text-orange-400"
            rel="noopener noreferrer"
            :to="{
              name: 'forums-forumId-discussions-discussionId',
              params: { forumId: channelId, discussionId: discussion.id },
            }"
          >
            {{ discussion.title }}
          </nuxt-link>
        </h3>

        <MarkdownPreview
          v-if="discussion?.body"
          class="max-w-none"
          :disable-gallery="true"
          :text="discussion.body"
          :word-limit="1000"
        />
      </div>
    </div>
  </div>
</template>

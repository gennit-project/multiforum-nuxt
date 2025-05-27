<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { useRoute } from "nuxt/app";
import { GET_MOD, GET_MOD_COMMENTS } from "@/graphQLData/mod/queries";
import Comment from "@/components/comments/Comment.vue";

const PAGE_LIMIT = 25;

const route = useRoute();
const modProfileName = computed(() => {
  return typeof route.params.modId === "string" ? route.params.modId : "";
});

const { 
  result: modResult, 
  error: getModError
} = useQuery(GET_MOD, () => ({
  displayName: modProfileName.value,
}));

const mod = computed(() => {
  if (modResult.value && modResult.value.moderationProfiles.length > 0) {
    return modResult.value.moderationProfiles[0];
  }
  return null;
});

const commentsAggregate = computed(() => {
  return mod.value ? mod.value.AuthoredCommentsAggregate?.count : 0;
});

const {
  result: commentResult,
  error,
  fetchMore,
} = useQuery(
  GET_MOD_COMMENTS,
  {
    displayName: modProfileName.value,
    limit: PAGE_LIMIT,
    offset: 0,
  },
  {
    fetchPolicy: "cache-first",
  }
);

const loadMore = () => {
  if (!commentResult.value?.moderationProfiles?.[0]?.AuthoredComments) return;

  fetchMore({
    variables: {
      limit: PAGE_LIMIT,
      offset: commentResult.value.moderationProfiles[0].AuthoredComments.length,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult;
      const prevModProfile = previousResult.moderationProfiles[0];
      const prevAuthoredComments = prevModProfile.AuthoredComments || [];
      const newComments =
        fetchMoreResult.moderationProfiles[0].AuthoredComments || [];
      return {
        moderationProfiles: [
          {
            ...prevModProfile,
            AuthoredComments: [...prevAuthoredComments, ...newComments],
          },
        ],
      };
    },
  });
};

const commentCount = computed(() => {
  return commentResult.value?.moderationProfiles[0]?.AuthoredComments?.length || 0;
});

const comments = computed(() => {
  return commentResult.value?.moderationProfiles[0]?.AuthoredComments || [];
});
</script>

<template>
  <div class="py-3 dark:text-white">
    <ErrorBanner v-if="error">
      {{ error.message }}
    </ErrorBanner>
    <ErrorBanner v-if="getModError">
      {{ getModError.message }}
    </ErrorBanner>
    <div v-else-if="commentCount === 0">No comments yet</div>
    <Comment
      v-for="comment in comments"
      :key="comment.id"
      :comment-data="comment"
      :parent-comment-id="
        comment.ParentComment ? comment.ParentComment.id : null
      "
      :depth="0"
      :show-channel="true"
      :show-context-link="true"
      :show-label="true"
      :go-to-permalink-on-click="true"
    />
    <div v-if="commentCount">
      <LoadMore
        class="justify-self-center"
        :reached-end-of-results="commentsAggregate === commentCount"
        @load-more="loadMore"
      />
    </div>
  </div>
</template>

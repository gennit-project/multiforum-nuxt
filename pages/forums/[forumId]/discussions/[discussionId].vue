<script lang="ts" setup>
import { ref, computed, watchEffect, onMounted, nextTick } from "vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { useQuery } from "@vue/apollo-composable";
import DiscussionDetailContent from "@/components/discussion/detail/DiscussionDetailContent.vue";
import { GET_LOCAL_MOD_PROFILE_NAME } from "@/graphQLData/user/queries";
import ErrorBanner from "@/components/ErrorBanner.vue";
import "md-editor-v3/lib/style.css";

// Route setup
const route = useRoute();

const updateDiscussionId = () => {
  if (typeof route.params.discussionId === "string") {
    return route.params.discussionId;
  }
  return "";
};

// Reactive state
const discussionId = ref(updateDiscussionId());

watchEffect(() => {
  discussionId.value = updateDiscussionId();
});

// Query for local mod profile name
const {
  result: localModProfileNameResult,
  loading: localModProfileNameLoading,
  error: localModProfileNameError,
} = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

const loggedInUserModName = computed(() => {
  if (localModProfileNameLoading.value || localModProfileNameError.value) {
    return "";
  }
  return localModProfileNameResult.value?.modProfileName || "";
});

// Scroll to top on component mount
onMounted(() => {
  nextTick(() => {
    window.scrollTo(0, 0);
  });
});

</script>

<template>
  <div class="relative max-w-screen-2xl p-0 flex-1 focus:outline-none xl:order-last">
    <div class="flex w-full justify-center space-y-4">
      <LoadingSpinner v-if="localModProfileNameLoading" class="h-12 w-12" />
      <ErrorBanner
        v-else-if="localModProfileNameError"
        :text="localModProfileNameError.message"
      />
      <ErrorBanner v-else-if="!discussionId" text="Discussion not found" />
      <DiscussionDetailContent
        v-else-if="
          discussionId &&
          !localModProfileNameError &&
          !localModProfileNameLoading
        "
        :key="discussionId"
        :discussion-id="discussionId"
        :logged-in-user-mod-name="loggedInUserModName"
      />
    </div>
  </div>
</template>

<style>
.large-width {
  width: 900px;
}

h1 {
  font-size: 2.65em;
  padding-bottom: 0.3em;
}
</style>

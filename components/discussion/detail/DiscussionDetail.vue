<script lang="ts">
import { defineComponent, computed, ref, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { relativeTime } from "../../../dateTimeUtils";
import { useDisplay } from "vuetify";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { useQuery } from "@vue/apollo-composable";
import DiscussionDetailContent from "./DiscussionDetailContent.vue";
import { GET_LOCAL_MOD_PROFILE_NAME } from "@/graphQLData/user/queries";
import ErrorBanner from "@/components/ErrorBanner.vue";
import "md-editor-v3/lib/style.css";

export default defineComponent({
  components: {
    DiscussionDetailContent,
    ErrorBanner,
    LoadingSpinner,
  },
  props: {
    compactMode: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const route = useRoute();

    const updateDiscussionId = () => {
      if (typeof route.params.discussionId === "string") {
        return route.params.discussionId;
      }
      return "";
    };

    const discussionId = ref(updateDiscussionId());

    watchEffect(() => {
      discussionId.value = updateDiscussionId();
    });

    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });

    const {
      result: localModProfileNameResult,
      loading: localModProfileNameLoading,
      error: localModProfileNameError,
    } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

    const loggedInUserModName = computed(() => {
      if (localModProfileNameLoading.value || localModProfileNameError.value) {
        return "";
      }
      return localModProfileNameResult.value.modProfileName;
    });

    const { lgAndUp, mdAndUp, smAndDown } = useDisplay();

    return {
      channelId,
      discussionId,
      lgAndUp,
      localModProfileNameError,
      localModProfileNameLoading,
      loggedInUserModName,
      mdAndUp,
      relativeTime,
      route,
      smAndDown,
    };
  },
  mounted() {
    this.$nextTick(() => {
      window.scrollTo(0, 0);
    });
  },
});
</script>

<template>
  <v-container
    fluid
    class="relative max-w-7xl p-0 flex-1 focus:outline-none xl:order-last"
  >
    <div
      :class="[smAndDown ? '' : '']"
      class="flex w-full justify-center space-y-4"
    >
      <LoadingSpinner
        v-if="localModProfileNameLoading"
        class="h-12 w-12"
      />
      <ErrorBanner
        v-else-if="localModProfileNameError"
        :text="localModProfileNameError.message"
      />
      <ErrorBanner
        v-else-if="!discussionId"
        text="Discussion not found"
      />
      <DiscussionDetailContent
        v-else-if="
          discussionId &&
            !localModProfileNameError &&
            !localModProfileNameLoading
        "
        :key="discussionId"
        :discussion-id="discussionId"
        :compact-mode="compactMode"
        :logged-in-user-mod-name="loggedInUserModName"
      />
    </div>
  </v-container>
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

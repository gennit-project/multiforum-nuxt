<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { useRoute, useRouter } from "vue-router";
import "md-editor-v3/lib/style.css";
import { useDisplay } from "vuetify";
import gql from "graphql-tag";
import { GET_USER } from "@/graphQLData/user/queries";
import { relativeTime } from "@/utils";
import MarkdownPreview from "../MarkdownPreview.vue";

export default defineComponent({
  name: "AboutPage",
  components: {
    MarkdownPreview,
  },
  props: {
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const route = useRoute();
    const router = useRouter();

    const username = computed(() => {
      if (typeof route.params.username === "string") {
        return route.params.username;
      }
      return "";
    });

    const { mdAndDown, lgAndDown } = useDisplay();
    const GET_THEME = gql`
      query getTheme {
        theme @client
      }
    `;

    const {
      result: themeResult,
      loading: themeLoading,
      error: themeError,
    } = useQuery(GET_THEME);

    const theme = computed(() => {
      if (themeLoading.value || themeError.value) {
        return "";
      }
      return themeResult.value.theme;
    });

    const {
      result,
      loading: getUserLoading,
      error: getUserError,
    } = useQuery(GET_USER, () => ({
      username: username.value,
    }));

    const user = computed(() => {
      if (getUserLoading.value || getUserError.value) {
        return null;
      }
      if (result.value && result.value.users.length > 0) {
        return result.value.users[0];
      }
      return null;
    });

    return {
      confirmDeleteIsOpen: ref(false),
      getUserError,
      getUserLoading,
      lgAndDown,
      mdAndDown,
      router,
      theme,
      user,
      username,
      relativeTime,
    };
  },
});
</script>

<template>
  <div class="sticky top-0 max-h-screen overflow-auto rounded-lg pt-6">
    <div class="mb-4 mt-6 p-4 flex flex-col gap-2">
      <Avatar
        class="shadow-sm"
        :src="user?.profilePicURL"
        :text="username"
        :is-square="false"
        :is-large="true"
      />
      <h1
        v-if="username && !user?.displayName"
        class="mb-2 mt-4 flex items-center gap-2 border-gray-700 text-xl font-bold leading-6 text-gray-500 dark:text-gray-200"
      >
        {{ username }}<span
          v-if="isAdmin"
          class="text-xs text-blue-500 px-2 py-1 border border-blue-500 rounded-md"
        >Admin</span>
      </h1>
      <h1
        v-if="user?.displayName"
        class="mt-4 flex border-gray-700 text-xl font-bold leading-6 text-gray-500 dark:text-gray-200"
      >
        {{ user.displayName }}
      </h1>
      <span
        v-if="user?.displayName"
        class="text-gray-600 dark:text-gray-400"
      >
        {{ `u/${username}` }}
      </span>

      <div v-if="user">
        <div class="-ml-4 w-full">
          <MarkdownPreview
            v-if="user.bio"
            :key="user.bio || ''"
            :text="user.bio"
            :word-limit="1000"
          />
        </div>
        <slot />
        <div
          v-if="user && username"
          class="mt-6 hidden min-w-0 flex-1 sm:block 2xl:hidden"
        >
          {{ `Joined ${relativeTime(user.createdAt)}` }}
        </div>
      </div>
      <ul
        v-if="user"
        class="m-4 list-disc"
      >
        <li>
          {{ `${user.commentKarma ?? 0} comment karma` }}
        </li>
        <li>
          {{ `${user.discussionKarma ?? 0} discussion karma` }}
        </li>
      </ul>
    </div>
  </div>
  <div class="w-full">
    <p v-if="getUserLoading">
      Loading...
    </p>
    <div v-else-if="getUserError">
      <div
        v-for="(error, i) of getUserError?.graphQLErrors"
        :key="i"
      >
        {{ error.message }}
      </div>
    </div>
    <div
      v-else-if="!user"
      class="px-4"
    >
      Could not find the user.
    </div>
  </div>
</template>
<style lang="scss" scoped>
/* Apply the user's preferred color scheme by default */
@media (prefers-color-scheme: dark) {
  #md-editor-v3-preview,
  #md-editor-v3-preview-wrapper {
    background-color: black;
  }
}

@media (prefers-color-scheme: light) {
  #md-editor-v3-preview,
  #md-editor-v3-preview-wrapper {
    background-color: blue;
  }
}
</style>

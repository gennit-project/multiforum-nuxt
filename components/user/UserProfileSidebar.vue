<script lang="ts" setup>
  import { computed } from "vue";
  import { useQuery } from "@vue/apollo-composable";
  import "md-editor-v3/lib/style.css";
  import { GET_USER } from "@/graphQLData/user/queries";
  import { relativeTime } from "@/utils";
  import MarkdownPreview from "@/components/MarkdownPreview.vue";
  import { useRoute } from "nuxt/app";
  import { usernameVar, profilePicURLVar } from "@/cache";

  // Define props
  defineProps({
    isAdmin: {
      type: Boolean,
      default: false,
    },
  });

  const route = useRoute();

  const username = computed(() => {
    if (typeof route.params.username === "string") {
      return route.params.username;
    }
    return "";
  });

  // Fetch the user data
  const {
    result,
    loading: getUserLoading,
    error: getUserError,
  } = useQuery(
    GET_USER,
    () => ({
      username: username.value,
    }),
    {
      enabled: !!usernameVar.value,
    }
  );

  const user = computed(() => {
    if (getUserLoading.value || getUserError.value) {
      return null;
    }
    return result.value?.users[0] || null;
  });

  // Use a computed property that prioritizes our global reactive state for profilePicURL
  const profilePic = computed(() => {
    // For the current user viewing their own profile, use the reactive state variable
    if (username.value === usernameVar.value && profilePicURLVar.value) {
      return profilePicURLVar.value;
    }
    // Otherwise use the profile pic from query result
    return user.value?.profilePicURL;
  });
</script>

<template>
  <div class="rounded-lg">
    <div class="flex flex-col gap-2 p-4">
      <AvatarComponent
        class="max-w-72 flex-1"
        :is-square="false"
        :src="profilePic"
        :text="username"
      />
      <h1
        v-if="username && !user?.displayName"
        class="mb-3 mt-3 flex items-center gap-2 border-gray-700 text-xl font-bold leading-6 text-gray-500 dark:text-gray-200"
      >
        {{ username }}
        <span
          v-if="isAdmin"
          class="rounded-md border border-blue-500 px-2 py-1 text-xs text-blue-500"
          >Admin</span
        >
      </h1>
      <h1
        v-if="user?.displayName"
        class="mt-4 flex border-gray-700 text-3xl leading-6 text-gray-500 dark:text-gray-200"
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
        <div class="w-full">
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
        <li>{{ `${user.commentKarma ?? 0} comment karma` }}</li>
        <li>{{ `${user.discussionKarma ?? 0} discussion karma` }}</li>
      </ul>
    </div>
  </div>

  <div class="w-full">
    <p v-if="getUserLoading">Loading...</p>
    <div v-else-if="getUserError">
      <div
        v-for="(error, i) of getUserError?.graphQLErrors"
        :key="i"
      >
        {{ error.message }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import 'md-editor-v3/lib/style.css';
import { GET_USER } from '@/graphQLData/user/queries';
import { relativeTime } from '@/utils';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import ReportProfilePictureModal from '@/components/mod/ReportProfilePictureModal.vue';
import FlagIcon from '@/components/icons/FlagIcon.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import { useRoute } from 'nuxt/app';
import { usernameVar, profilePicURLVar } from '@/cache';

// Define props
defineProps({
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();

const username = computed(() => {
  if (typeof route.params.username === 'string') {
    return route.params.username;
  }
  return '';
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

// Report profile picture modal state
const showReportModal = ref(false);

// Only show report button if viewing another user's profile that has a profile picture
const canReportProfilePicture = computed(() => {
  return (
    username.value !== usernameVar.value && // Not viewing own profile
    !!profilePic.value // Profile has a picture
  );
});

const handleReportSuccess = () => {
  showReportModal.value = false;
};
</script>

<template>
  <div class="rounded-lg">
    <div class="flex flex-col gap-2 p-4">
      <div class="relative">
        <AvatarComponent
          class="max-w-72 flex-1"
          :src="profilePic"
          :text="username"
          :is-square="false"
        />
        <RequireAuth v-if="canReportProfilePicture">
          <template #authenticated>
            <button
              class="absolute bottom-2 right-2 rounded-full bg-white/80 p-2 text-gray-600 shadow-md transition-colors hover:bg-red-50 hover:text-red-600 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-red-900/50 dark:hover:text-red-400"
              title="Report profile picture"
              @click="showReportModal = true"
            >
              <FlagIcon class="h-4 w-4" />
            </button>
          </template>
          <template #unauthenticated>
            <span />
          </template>
        </RequireAuth>
      </div>
      <h1
        v-if="username && !user?.displayName"
        class="mb-3 mt-3 flex items-center gap-2 border-gray-700 text-xl font-bold leading-6 text-gray-500 dark:text-gray-200"
      >
        {{ username }}
        <span
          v-if="isAdmin"
          class="rounded-md border border-orange-500 px-2 py-1 text-xs text-orange-500"
          >Admin</span
        >
      </h1>
      <h1
        v-if="user?.displayName"
        class="mt-4 flex items-center gap-2 border-gray-700 text-3xl leading-6 text-gray-500 dark:text-gray-200"
      >
        {{ user.displayName }}
        <span
          v-if="isAdmin"
          class="rounded-md border border-orange-600 px-2 py-1 text-sm text-orange-600 dark:border-orange-500 dark:text-orange-500"
          >Admin</span
        >
      </h1>
      <span v-if="user?.displayName" class="text-gray-600 dark:text-gray-400">
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
          class="mt-6 hidden min-w-0 flex-1 text-gray-600 dark:text-gray-400 sm:block 2xl:hidden"
        >
          {{ `Joined ${relativeTime(user.createdAt)}` }}
        </div>
      </div>

      <ul v-if="user" class="m-4 list-disc text-gray-700 dark:text-gray-300">
        <li>{{ `${user.commentKarma ?? 0} comment karma` }}</li>
        <li>{{ `${user.discussionKarma ?? 0} discussion karma` }}</li>
      </ul>
    </div>
  </div>

  <div class="w-full">
    <p v-if="getUserLoading">Loading...</p>
    <div v-else-if="getUserError">
      <div v-for="(error, i) of getUserError?.graphQLErrors" :key="i">
        {{ error.message }}
      </div>
    </div>
  </div>

  <ReportProfilePictureModal
    :username="username"
    :display-name="user?.displayName || ''"
    :open="showReportModal"
    @close="showReportModal = false"
    @report-submitted-successfully="handleReportSuccess"
  />
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
    background-color: orange;
  }
}
</style>

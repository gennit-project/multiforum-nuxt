<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import { useIsAuthenticated } from '@/composables/useAuthState';
import { useAuthNavigation } from '@/composables/useAuthNavigation';

/*
Fallback for RequireAuth's does-not-have-auth slot. A signed-out visitor may
well be allowed in once they sign in (e.g. the owner of the download they are
trying to edit), so telling them they "don't have permission" is misleading.
Signed out: ask them to sign in and return here. Signed in: the permission
message. Auth state comes from the server session via the payload, and the
login URL from the route, so server and client render the same markup.
*/
const props = defineProps({
  // Completes "Sign in to …", e.g. "edit this download".
  action: {
    type: String,
    default: 'see this page',
  },
  message: {
    type: String,
    default: "You don't have permission to see this page.",
  },
});

const isAuthenticated = useIsAuthenticated();
const route = useRoute();
const { getLoginUrl } = useAuthNavigation();

const loginUrl = computed(() =>
  getLoginUrl(route.fullPath.split('#', 1)[0] || '/')
);
const heading = computed(() => `Sign in to ${props.action}`);
</script>

<template>
  <div
    v-if="!isAuthenticated"
    class="flex flex-col items-center gap-3 p-8 text-center dark:text-white"
    data-testid="access-denied-sign-in"
  >
    <p class="text-base font-medium">{{ heading }}</p>
    <a
      :href="loginUrl"
      class="bg-brand-700 hover:bg-brand-800 focus:ring-brand-500 inline-flex rounded-md px-4 py-2 text-sm font-medium text-white focus:ring-2 focus:outline-none"
    >
      Sign in
    </a>
  </div>
  <div
    v-else
    class="flex justify-center p-8 dark:text-white"
    data-testid="access-denied-permission"
  >
    {{ message }}
  </div>
</template>

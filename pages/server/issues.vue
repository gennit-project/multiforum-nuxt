<script lang="ts" setup>
// Public, read-friendly view of the server-wide issue list. This mirrors the
// admin issue tab (/admin/issues) but without the admin-only ServerTabs
// sidebar, so the moderation queue is transparent to everyone while the admin
// dashboard entry point stays gated to moderators. Anyone can read; opening a
// new issue still requires a logged-in account (handled by ServerIssueTabNav's
// RequireAuth), matching the GitHub issues model.
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import ServerIssueTabNav from '@/components/mod/ServerIssueTabNav.vue';
import ServerIssueSplitView from '@/components/mod/ServerIssueSplitView.vue';

const route = useRoute();

const showIssueDetailPane = computed(() => {
  const routeName = route.name?.toString() || '';
  return routeName === 'server-issues' || routeName === 'server-issues-closed';
});
</script>

<template>
  <NuxtLayout>
    <div class="flex w-full flex-1 justify-center">
      <article
        class="w-full max-w-screen-2xl rounded-lg focus:outline-none dark:bg-black"
      >
        <ServerIssueSplitView :show-detail-pane="showIssueDetailPane">
          <h1 class="mb-2 px-3 text-2xl font-bold dark:text-white">
            Moderation Issues
          </h1>
          <ServerIssueTabNav
            open-route-name="server-issues"
            closed-route-name="server-issues-closed"
            create-route-name="server-issues-create"
          />
          <div class="max-w-full">
            <NuxtPage />
          </div>
        </ServerIssueSplitView>
      </article>
    </div>
  </NuxtLayout>
</template>

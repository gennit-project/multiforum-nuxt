<script setup lang="ts">
import ChannelTabs from "@/components/channel/ChannelTabs.vue";
import ChannelHeaderMobile from "@/components/channel/ChannelHeaderMobile.vue";
import ChannelHeaderDesktop from "@/components/channel/ChannelHeaderDesktop.vue";
import DiscussionTitleEditForm from "@/components/discussion/detail/DiscussionTitleEditForm.vue";
import EventTitleEditForm from "@/components/event/detail/EventTitleEditForm.vue";
import IssueTitleEditForm from "@/components/mod/IssueTitleEditForm.vue";
import { GET_CHANNEL } from "@/graphQLData/channel/queries";
import type { Channel, User } from "@/__generated__/graphql";
import { computed } from "vue";
import ChannelSidebar from "@/components/channel/ChannelSidebar.vue";
import { useRoute, useRouter } from "nuxt/app";
import { useQuery } from "@vue/apollo-composable";
import { DateTime } from "luxon";
import BackLink from "@/components/BackLink.vue";

const route = useRoute();
const router = useRouter();

const showDiscussionTitle = computed(() =>
  route.name?.toString().includes("forums-forumId-discussions-discussionId")
);
const showEventTitle = computed(() =>
  route.name?.toString().includes("forums-forumId-events-eventId")
);
const showIssueTitle = computed(() =>
  route.name?.toString().includes("forums-forumId-issues-issueId")
);

const showChannelTabs = computed(() => {
  return (
    !showDiscussionTitle.value && !showEventTitle.value && !showIssueTitle.value
  );
});

const channelId = computed(() => {
  return typeof route.params.forumId === "string" ? route.params.forumId : "";
});

const { result: getChannelResult, onResult: onGetChannelResult } = useQuery(
  GET_CHANNEL,
  {
    uniqueName: channelId,
    // Using luxon, round down to the nearest hour
    now: DateTime.local().startOf("hour").toISO(),
  },
  {
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
  }
);

const channel = computed(() => {
  return getChannelResult.value?.channels?.[0] ?? null;
});

const addForumToLocalStorage = (channel: Channel) => {
  if (!import.meta.client) {
    return;
  }
  let recentForums =
    JSON.parse(localStorage.getItem("recentForums") || "[]") || [];

  const sideNavItem = {
    uniqueName: channelId.value,
    displayName: channel.displayName,
    channelIconURL: channel.channelIconURL,
    timestamp: Date.now(),
  };

  recentForums = recentForums.filter(
    (forum: any) => forum.uniqueName !== channelId.value
  );

  recentForums.unshift(sideNavItem);

  // Limit to 20 items after adding the new one
  recentForums = recentForums.slice(0, 20);

  // Clean up invalid entries
  recentForums = recentForums.filter((forum: any) => typeof forum === "object");

  localStorage.setItem("recentForums", JSON.stringify(recentForums));
};
onGetChannelResult((result) => {
  const channel = result.data?.channels[0];
  if (channel) {
    addForumToLocalStorage(channel);
  }
  // redirect to /discussions if we are at the channel root
  if (route.name === "forums-forumId") {
    router.push({
      name: "forums-forumId-discussions",
      params: {
        forumId: channelId.value,
      },
    });
  }
});
const adminList = computed(() => {
  return channel.value
    ? channel.value.Admins.map((user: User) => user?.username)
    : [];
});
if (!channelId.value) {
  if (import.meta.client) {
    router.push({
      name: "forums-forumId-discussions",
      params: {
        forumId: channelId.value,
      },
    });
  }
}
</script>

<template>
  <NuxtLayout>
    <div
      v-if="channel"
      class="flex flex-col md:min-h-screen dark:bg-black bg-gray-100 dark:text-white"
    >
      <ChannelHeaderMobile
        class="block md:hidden"
        :channel="channel"
        :channel-id="channelId"
      />
      <ChannelHeaderDesktop
        class="hidden md:block"
        :channel="channel"
        :channel-id="channelId"
        :admin-list="adminList"
        :route="route"
        :show-create-button="true"
      >
        <ChannelTabs
          v-if="showChannelTabs"
          class="w-full border-b border-gray-200 bg-white px-3 dark:border-gray-600 dark:bg-gray-800 md:px-6"
          :vertical="false"
          :show-counts="true"
          :admin-list="adminList"
          :route="route"
          :channel="channel"
          :desktop="true"
        />
      </ChannelHeaderDesktop>
      <main class="flex justify-center w-full">
        <article
          class="w-full max-w-screen-2xl rounded-lg dark:bg-black focus:outline-none"
        >
          <ChannelTabs
            v-if="showChannelTabs"
            class="block md:hidden mb-2 w-full border-b border-gray-200 bg-white px-3 dark:border-gray-600 dark:bg-gray-800"
            :vertical="false"
            :show-counts="true"
            :admin-list="adminList"
            :route="route"
            :channel="channel"
            :desktop="false"
          />

          <div v-if="showDiscussionTitle" class="flex w-full items-start gap-2">
            <BackLink
              class="mt-6"
              :link="`/forums/${channelId}/discussions`"
              :data-testid="'discussion-detail-back-link'"
            />
            <div class="max-w-screen-2xl flex-1 pr-3">
              <DiscussionTitleEditForm />
            </div>
          </div>
          <div v-else-if="showEventTitle" class="flex w-full items-start gap-2">
            <BackLink
              class="mt-6"
              :link="`/forums/${channelId}/events`"
              :data-testid="'event-detail-back-link'"
            />
            <div class="max-w-screen-2xl flex-1 pr-3">
              <EventTitleEditForm />
            </div>
          </div>
          <div v-else-if="showIssueTitle" class="flex w-full items-start gap-2">
            <div class="max-w-screen-2xl flex-1 pr-3">
              <IssueTitleEditForm />
            </div>
          </div>

          <div class="relative w-full">
            <div
              class="flex flex-col md:flex-row divide-x dark:divide-gray-500"
            >
              <div class="flex-1 p-0 md:p-6 bg-white dark:bg-gray-800">
                <NuxtPage />
              </div>
              <aside
                v-if="channelId"
                class="md:w-1/4 flex-shrink-0 bg-white dark:bg-gray-800 md:sticky md:top-0 md:overflow-y-auto md:max-h-screen"
              >
                <ChannelSidebar
                  v-if="channel"
                  :channel="channel"
                  class="p-6 pt-8"
                />
              </aside>
            </div>
          </div>
        </article>
      </main>
    </div>
  </NuxtLayout>
</template>

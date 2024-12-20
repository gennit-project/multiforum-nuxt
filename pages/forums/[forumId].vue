<script setup lang="ts">
import ChannelTabs from "@/components/channel/ChannelTabs.vue";
import ChannelHeaderMobile from "@/components/channel/ChannelHeaderMobile.vue";
import ChannelHeaderDesktop from "@/components/channel/ChannelHeaderDesktop.vue";
import DiscussionTitleEditForm from "@/components/discussion/detail/DiscussionTitleEditForm.vue";
import EventTitleEditForm from "@/components/event/detail/EventTitleEditForm.vue";
import { GET_CHANNEL } from "@/graphQLData/channel/queries";
import type { Channel, User } from "@/__generated__/graphql";
import { computed } from "vue";
import ChannelSidebar from "@/components/channel/ChannelSidebar.vue";
import { useRoute, useRouter } from "nuxt/app";
import { useQuery } from "@vue/apollo-composable";
import { DateTime } from "luxon";
import { useIsMobile } from "@/composables/useIsMobile";

const route = useRoute();
const router = useRouter();
const isMobile = useIsMobile();

const showDiscussionTitle = computed(() =>
  route.name?.toString().includes("forums-forumId-discussions-discussionId")
);
const showEventTitle = computed(() =>
  route.name?.toString().includes("forums-forumId-events-eventId")
);

const channelId = computed(() => {
  return typeof route.params.forumId === "string" ? route.params.forumId : "";
});

const {
  result: getChannelResult,
  loading: getChannelLoading,
  error: getChannelError,
  onResult: onGetChannelResult,
} = useQuery(
  GET_CHANNEL,
  {
    uniqueName: channelId,
    // Using luxon, round down to the nearest hour
    now: DateTime.local().startOf("hour").toISO(),
  },
  {
    fetchPolicy: "cache-first",
  }
);

const channel = computed(() => {
  const channel = getChannelResult.value?.channels?.[0];
  if ((getChannelLoading.value && !channel) || getChannelError.value) {
    return null;
  }
  return channel ?? null;
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
  };
  recentForums = recentForums.slice(0, 20);
  recentForums.push(sideNavItem);
  recentForums = recentForums.filter((forum: any) => typeof forum === "object");
  recentForums = recentForums.filter(
    (forum: any, index: number, self: any) =>
      index === self.findIndex((t: any) => t.uniqueName === forum.uniqueName)
  );

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
      class="flex flex-col justify-center dark:bg-black bg-gray-100 dark:text-white"
    >
      <ChannelHeaderMobile
        v-show="isMobile"
        :channel="channel"
        :channel-id="channelId"
      />
      <ChannelHeaderDesktop
        v-show="!isMobile"
        :channel="channel"
        :channel-id="channelId"
        :admin-list="adminList"
        :route="route"
        :show-create-button="true"
      >
        <ChannelTabs
          class="w-full border-b border-gray-200 bg-white px-3 dark:border-gray-600 dark:bg-gray-800 md:px-6"
          :vertical="false"
          :show-counts="true"
          :admin-list="adminList"
          :route="route"
          :channel="channel"
          :desktop="true"
        />
      </ChannelHeaderDesktop>
      <div v-if="channel" class="w-full flex justify-center">
        <article
          class="relative h-full max-w-screen-2xl w-full rounded-lg dark:bg-black focus:outline-none"
        >
          <ChannelTabs
            v-show="isMobile"
            class="mb-2 w-full border-b border-gray-200 bg-white px-3 dark:border-gray-600 dark:bg-gray-800"
            :vertical="false"
            :show-counts="true"
            :admin-list="adminList"
            :route="route"
            :channel="channel"
            :desktop="false"
          />
          <div v-if="showDiscussionTitle" class="flex w-full justify-center">
            <div class="max-w-screen-2xl flex-1 px-3 md:px-6">
              <DiscussionTitleEditForm />
            </div>
          </div>
          <div v-else-if="showEventTitle" class="flex w-full justify-center">
            <div class="max-w-screen-2xl flex-1 px-3 md:px-6">
              <EventTitleEditForm />
            </div>
          </div>
          <div
            class="w-full relative max-w-screen-2xl flex-1 focus:outline-none"
          >
            <div
              class="w-full flex flex-col md:flex-row divide-x dark:divide-gray-500"
            >
              <div class="w-full md:w-9/12 p-0 bg-white dark:bg-gray-800">
                <NuxtPage />
              </div>
              <div
                v-if="channelId"
                class="w-full flex-1 p-0 bg-white dark:bg-gray-800"
              >
                <ChannelSidebar
                  v-if="channel"
                  :channel="channel"
                  class="sticky top-0 overflow-auto p-6 pt-8"
                />
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </NuxtLayout>
</template>

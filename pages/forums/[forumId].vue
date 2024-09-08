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
import { useRoute } from "vue-router";
import { useQuery } from "@vue/apollo-composable";
import { useDisplay } from "vuetify";

const route = useRoute();
const router = useRouter();

// Determine if the current route is for a discussion or event detail page
const isDiscussionDetailPage = computed(
  () => route.name === "DiscussionDetail"
);
const isEventDetailPage = computed(() => route.name === "EventDetail");

// Extract the channel ID from the route parameters
const channelId = computed(() => {
  return typeof route.params.forumId === "string" ? route.params.forumId : "";
});
// Query for the channel using Apollo client
const {
  result: getChannelResult,
  loading: getChannelLoading,
  error: getChannelError,
  onResult: onGetChannelResult,
} = useQuery(GET_CHANNEL, {
  uniqueName: channelId,
  now: new Date().toISOString(),
});

// Extract channel information from the query result
const channel = computed(() => {
  if (getChannelLoading.value || getChannelError.value) {
    return null;
  }
  return getChannelResult.value?.channels?.[0] ?? null;
});

// Utility to add the forum to local storage
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

  // Save the most recent 20
  recentForums = recentForums.slice(0, 20);
  recentForums.push(sideNavItem);

  // Filter out any values that are strings instead of objects
  recentForums = recentForums.filter((forum: any) => typeof forum === "object");

  // Deduplicate the array
  recentForums = recentForums.filter(
    (forum: any, index: number, self: any) =>
      index === self.findIndex((t: any) => t.uniqueName === forum.uniqueName)
  );

  localStorage.setItem("recentForums", JSON.stringify(recentForums));
};

// React to channel query results and update local storage
onGetChannelResult((result) => {
  const channel = result.data?.channels[0];
  if (channel) {
    addForumToLocalStorage(channel);
  }
});

// Get admin list from the channel
const adminList = computed(() => {
  return channel.value
    ? channel.value.Admins.map((user: User) => user?.username)
    : [];
});
const { smAndDown, mdAndDown } = useDisplay();

// If we are at forums/[channelId], redirect to forums/[channelId]/discussions
if (!channelId.value) {
  if (import.meta.client) {
    router.push({
      name: "ChannelDiscussions",
      params: {
        forumId: channelId.value,
      },
    });
  }
}
</script>

<template>
  <NuxtLayout>
    <div class="flex-col justify-center dark:bg-black">
      <!-- Mobile Header -->
      <ChannelHeaderMobile
        v-if="smAndDown && channel"
        :channel="channel"
        :channel-id="channelId"
        :show-create-button="true"
      />
      <div v-if="smAndDown" class="w-full">
        <article
          class="relative h-full max-w-7xl rounded-lg bg-gray-100 dark:bg-black focus:outline-none xl:order-last"
        >
          <ChannelTabs
            v-if="channel && smAndDown"
            class="mb-2 block w-full border-b border-gray-200 bg-white px-3 dark:border-gray-600 dark:bg-gray-800 md:px-6"
            :vertical="false"
            :show-counts="true"
            :admin-list="adminList"
            :route="route"
            :channel="channel"
          />
          <div v-if="isDiscussionDetailPage" class="flex w-full justify-center">
            <div class="max-w-7xl flex-1 px-3 md:px-6">
              <DiscussionTitleEditForm />
            </div>
          </div>
          <div v-else-if="isEventDetailPage" class="flex w-full justify-center">
            <div class="max-w-7xl flex-1 px-3 md:px-6">
              <EventTitleEditForm />
            </div>
          </div>
          <div>
            <v-container
              fluid
              class="relative max-w-7xl flex-1 pt-4 focus:outline-none lg:px-6 xl:order-last"
            >
              <v-row class="flex divide-x dark:divide-gray-500">
                <v-col
                  :cols="mdAndDown ? 12 : 8"
                  class="p-0 bg-white dark:bg-gray-800"
                >
                  <NuxtPage />
                </v-col>
                <v-col
                  v-if="channelId"
                  :cols="mdAndDown ? 12 : 4"
                  class="p-0 bg-white dark:bg-gray-800"
                >
                  <ChannelSidebar
                    v-if="channel"
                    :channel="channel"
                    class="sticky top-0 overflow-auto p-6 pt-8"
                  />
                </v-col>
              </v-row>
            </v-container>
          </div>
        </article>
      </div>

      <!-- Desktop Header -->
      <article v-if="!smAndDown && channel" class="w-full">
        <ChannelHeaderDesktop
          :channel="channel"
          :channel-id="channelId"
          :admin-list="adminList"
          :route="route"
          :show-create-button="true"
        >
          <ChannelTabs
            v-if="channel"
            class="mb-6 block w-full border-b border-gray-200 bg-white px-3 dark:border-gray-600 dark:bg-gray-800 md:px-6"
            :vertical="false"
            :show-counts="true"
            :admin-list="adminList"
            :route="route"
            :channel="channel"
          />
        </ChannelHeaderDesktop>
        <div v-if="isDiscussionDetailPage" class="flex w-full justify-center">
          <div class="max-w-7xl flex-1 px-6">
            <DiscussionTitleEditForm />
          </div>
        </div>
        <div v-else-if="isEventDetailPage" class="flex w-full justify-center">
          <div class="max-w-7xl flex-1 px-6">
            <EventTitleEditForm />
          </div>
        </div>
        <v-container
          fluid
          class="relative max-w-7xl flex-1 pt-4 focus:outline-none lg:px-6 xl:order-last"
        >
          <v-row class="flex divide-x dark:divide-gray-500">
            <v-col
              :cols="mdAndDown ? 12 : 8"
              class="p-0 bg-white dark:bg-gray-800"
            >
              <NuxtPage />
            </v-col>
            <v-col
              v-if="channelId"
              :cols="mdAndDown ? 12 : 4"
              class="p-0 bg-white dark:bg-gray-800"
            >
              <ChannelSidebar
                v-if="channel"
                :channel="channel"
                class="sticky top-0 overflow-auto p-6 pt-8"
              />
            </v-col>
          </v-row>
        </v-container>
      </article>
    </div>
  </NuxtLayout>
</template>

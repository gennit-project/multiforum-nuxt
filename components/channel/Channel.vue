<script lang="ts">
import ChannelTabs from "./ChannelTabs.vue";
import { useRoute } from "vue-router";
import { defineComponent, computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import { GET_CHANNEL } from "@/graphQLData/channel/queries";
import { useQuery } from "@vue/apollo-composable";
import gql from "graphql-tag";
import type { User } from "@/src/__generated__/graphql";
import ChannelContent from "./ChannelContent.vue";
import ChannelHeaderMobile from "./ChannelHeaderMobile.vue";
import ChannelHeaderDesktop from "./ChannelHeaderDesktop.vue";
import type { Channel } from "@/src/__generated__/graphql";
import DiscussionTitleEditForm from "@/components/discussion/detail/DiscussionTitleEditForm.vue";
import EventTitleEditForm from "@/components/event/detail/EventTitleEditForm.vue";

export default defineComponent({
  name: "ChannelComponent",
  components: {
    ChannelContent,
    ChannelHeaderMobile,
    ChannelTabs,
    ChannelHeaderDesktop,
    DiscussionTitleEditForm,
    EventTitleEditForm,
  },
  setup() {
    const route = useRoute();

    const isDiscussionDetailPage = computed(() => route.name === "DiscussionDetail");
    const isEventDetailPage = computed(() => route.name === "EventDetail");

    const GET_THEME = gql`
      query getTheme {
        theme @client
      }
    `;
    const { result: themeResult, loading: themeLoading, error: themeError } = useQuery(GET_THEME);

    const theme = computed(() => {
      if (themeLoading.value || themeError.value) {
        return "";
      }
      return themeResult.value.theme;
    });

    const channelId = computed(() => {
      if (typeof route.params.channelId !== "string") {
        return "";
      }
      return route.params.channelId;
    });

    const { result: getChannelResult, loading: getChannelLoading, error: getChannelError, onResult: onGetChannelResult } = useQuery(GET_CHANNEL, {
      uniqueName: channelId,
      now: new Date().toISOString(),
    });

    const channel = computed(() => {
      if (getChannelLoading.value || getChannelError.value) {
        return null;
      }
      return getChannelResult.value.channels[0];
    });

    const addForumToLocalStorage = (channel: Channel) => {
      let recentForums = JSON.parse(localStorage.getItem("recentForums") || "[]") || [];

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

    onGetChannelResult((result) => {
      const channel = result.data?.channels[0];
      if (channel) {
        addForumToLocalStorage(channel);
      }
    });

    const discussionId = computed(() => route.params.discussionId);
    const eventId = computed(() => route.params.eventId);

    const adminList = computed(() => {
      return channel.value ? channel.value.Admins.map((user: User) => user.username) : [];
    });

    // Using Vuetify's `useDisplay()` for responsive conditions
    const display = useDisplay();
    const lgAndDown = display.lgAndDown;
    const lgAndUp = display.lgAndUp;
    const mdAndUp = display.mdAndUp;
    const mdAndDown = display.mdAndDown;
    const smAndDown = display.smAndDown;

    const showChannelHeader = computed(() => {
      const validRoutes = ["SearchDiscussionsInChannel", "SearchEventsInChannel", "EditChannel", "OpenIssues", "ClosedIssues", "About"];
      return validRoutes.includes(route.name as string);
    });

    return {
      adminList,
      channel,
      channelId,
      discussionId,
      eventId,
      isDiscussionDetailPage,
      isEventDetailPage,
      route,
      lgAndDown,
      leftColumnIsExpanded: ref(true),
      mdAndDown,
      lgAndUp,
      mdAndUp,
      showChannelHeader,
      showMenu: ref(false),
      smAndDown,
      theme,
    };
  },
  created() {
    watch(
      () => this.$route,
      (newRoute) => {
        this.route = newRoute;
      }
    );
  },
});
</script>

<template>
  <div class="flex-col justify-center dark:bg-black">
    <ChannelHeaderMobile
      v-if="smAndDown && channel"
      :channel="channel"
      :channel-id="channelId"
      :show-create-button="true"
    />
    <div v-if="smAndDown" class="w-full">
      <article class="relative h-full max-w-7xl rounded-lg bg-gray-100 dark:bg-black focus:outline-none xl:order-last">
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
          <NuxtPage />
        </div>
      </article>
    </div>

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
      <ChannelContent>
        <NuxtPage />
      </ChannelContent>
    </article>
  </div>
</template>
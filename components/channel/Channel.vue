<script lang="ts">
import ChannelTabs from "./ChannelTabs.vue";
import { useRoute } from "vue-router";
import { defineComponent, computed, ref } from "vue";
import { useDisplay } from "vuetify";
import { GET_CHANNEL } from "@/graphQLData/channel/queries";
import { useQuery } from "@vue/apollo-composable";
import { router } from "@/router";
import gql from "graphql-tag";
import { User } from "@/__generated__/graphql";
import ChannelContent from "./ChannelContent.vue";
import ChannelHeaderMobile from "./ChannelHeaderMobile.vue";
import ChannelHeaderDesktop from "./ChannelHeaderDesktop.vue";
import { Channel } from "@/__generated__/graphql";
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
    const route = ref(useRoute());

    const isDiscussionDetailPage = computed(() => {
      return route.value.name === "DiscussionDetail";
    });
    const isEventDetailPage = computed(() => {
      return route.value.name === "EventDetail";
    });
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

    const channelId = computed(() => {
      if (typeof route.value.params.channelId !== "string") {
        return "";
      }
      return route.value.params.channelId;
    });

    const {
      error: getChannelError,
      result: getChannelResult,
      loading: getChannelLoading,
      onResult: onGetChannelResult,
    } = useQuery(GET_CHANNEL, {
      uniqueName: channelId,
      now: new Date().toISOString(),
    });
    const channel = computed(() => {
      if (getChannelLoading.value || getChannelError.value) {
        return null;
      }
      const channel = getChannelResult.value.channels[0];
      return channel;
    });

    const addForumToLocalStorage = (channel: Channel) => {
      let recentForums =
        JSON.parse(localStorage.getItem("recentForums") || '""') || [];

      const sideNavItem = {
        uniqueName: channelId.value,
        displayName: channel.displayName,
        channelIconURL: channel.channelIconURL,
      };
      // save the most recent 20
      recentForums = recentForums.slice(0, 20);
      recentForums.push(sideNavItem);

      // filter out any values that are strings instead of objects
      recentForums = recentForums.filter(
        (forum: any) => typeof forum === "object",
      );

      // deduplicate the array
      recentForums = recentForums.filter(
        (forum: any, index: number, self: any) =>
          index ===
          self.findIndex((t: any) => t.uniqueName === forum.uniqueName),
      );

      localStorage.setItem("recentForums", JSON.stringify(recentForums));
    };

    onGetChannelResult((result) => {
      const channel = result.data?.channels[0];
      if (!channel) {
        return;
      }
      addForumToLocalStorage(channel);
    });

    const discussionId = computed(() => {
      return route.value.params.discussionId;
    });

    const eventId = computed(() => {
      return route.value.params.eventId;
    });

    const adminList = computed(() => {
      if (!channel.value) {
        return [];
      }
      return channel.value.Admins.map((user: User) => {
        return user.username;
      });
    });
    const { lgAndDown, lgAndUp, mdAndUp, mdAndDown, smAndDown } = useDisplay();

    const showChannelHeader = computed(() => {
      if (route.value.name === "SearchDiscussionsInChannel") {
        return true;
      }

      if (route.value.name === "SearchEventsInChannel") {
        return true;
      }

      if (route.value.name === "EditChannel") {
        return true;
      }

      if (route.value.name === "OpenIssues") {
        return true;
      }

      if (route.value.name === "ClosedIssues") {
        return true;
      }

      if (route.value.name === "About") {
        return true;
      }
      return false;
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
      router,
      showChannelHeader,
      showMenu: ref(false),
      smAndDown,
      theme,
    };
  },
  created() {
    this.$watch("$route", (newRoute: any) => {
      this.route = newRoute;
    });
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
    <div
      v-if="smAndDown"
      class="w-full"
    >
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
        <div
          v-if="isDiscussionDetailPage"
          class="flex w-full justify-center"
        >
          <div class="max-w-7xl flex-1 px-3 md:px-6">
            <DiscussionTitleEditForm />
          </div>
        </div>
        <div
          v-else-if="isEventDetailPage"
          class="flex w-full justify-center"
        >
          <div class="max-w-7xl flex-1 px-3 md:px-6">
            <EventTitleEditForm />
          </div>
        </div>
        <div>
          <router-view />
        </div>
      </article>
    </div>

    <article
      v-if="!smAndDown && channel"
      class="w-full"
    >
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
      <div
        v-if="isDiscussionDetailPage"
        class="flex w-full justify-center"
      >
        <div class="max-w-7xl flex-1 px-6">
          <DiscussionTitleEditForm />
        </div>
      </div>
      <div
        v-else-if="isEventDetailPage"
        class="flex w-full justify-center"
      >
        <div class="max-w-7xl flex-1 px-6">
          <EventTitleEditForm />
        </div>
      </div>
      <ChannelContent>
        <router-view />
      </ChannelContent>
    </article>
  </div>
</template>

<style>
#channelAvatar {
  background-color: #4474c0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='152' height='152' viewBox='0 0 152 152'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='temple' fill='%23efefef' fill-opacity='0.4'%3E%3Cpath d='M152 150v2H0v-2h28v-8H8v-20H0v-2h8V80h42v20h20v42H30v8h90v-8H80v-42h20V80h42v40h8V30h-8v40h-42V50H80V8h40V0h2v8h20v20h8V0h2v150zm-2 0v-28h-8v20h-20v8h28zM82 30v18h18V30H82zm20 18h20v20h18V30h-20V10H82v18h20v20zm0 2v18h18V50h-18zm20-22h18V10h-18v18zm-54 92v-18H50v18h18zm-20-18H28V82H10v38h20v20h38v-18H48v-20zm0-2V82H30v18h18zm-20 22H10v18h18v-18zm54 0v18h38v-20h20V82h-18v20h-20v20H82zm18-20H82v18h18v-18zm2-2h18V82h-18v18zm20 40v-18h18v18h-18zM30 0h-2v8H8v20H0v2h8v40h42V50h20V8H30V0zm20 48h18V30H50v18zm18-20H48v20H28v20H10V30h20V10h38v18zM30 50h18v18H30V50zm-2-40H10v18h18V10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
</style>

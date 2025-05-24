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
  import { useRoute, useRouter, useHead } from "nuxt/app";
  import { useQuery } from "@vue/apollo-composable";
  import { DateTime } from "luxon";
  import BackLink from "@/components/BackLink.vue";

  const route = useRoute();
  const router = useRouter();

  const showDiscussionTitle = computed(
    () =>
      route.name?.toString().includes("forums-forumId-discussions-discussionId") ||
      route.name?.toString().includes("forums-forumId-downloads-discussionId")
  );
  const showEventTitle = computed(() =>
    route.name?.toString().includes("forums-forumId-events-eventId")
  );
  const showIssueTitle = computed(() =>
    route.name?.toString().includes("forums-forumId-issues-issueId")
  );

  const showChannelTabs = computed(() => {
    return (
      !showDiscussionTitle.value &&
      !showEventTitle.value &&
      !showIssueTitle.value &&
      !`${String(route.name)}`.includes("feedback")
    );
  });

  const showChannelSidebar = computed(() => {
    // Hide sidebar on wiki pages and download detail pages to give more reading space
    return (
      !`${String(route.name)}`.includes("wiki") &&
      !`${String(route.name)}`.includes("forums-forumId-downloads-discussionId")
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
      enabled: !!channelId.value,
    }
  );

  const channel = computed(() => {
    return getChannelResult.value?.channels?.[0] ?? null;
  });

  const addForumToLocalStorage = (channel: Channel) => {
    if (!import.meta.client) {
      return;
    }
    let recentForums = JSON.parse(localStorage.getItem("recentForums") || "[]") || [];

    const sideNavItem = {
      uniqueName: channelId.value,
      displayName: channel.displayName,
      channelIconURL: channel.channelIconURL,
      timestamp: Date.now(),
    };

    recentForums = recentForums.filter((forum: any) => forum.uniqueName !== channelId.value);

    recentForums.unshift(sideNavItem);

    // Limit to 20 items after adding the new one
    recentForums = recentForums.slice(0, 20);

    // Clean up invalid entries
    recentForums = recentForums.filter((forum: any) => typeof forum === "object");

    localStorage.setItem("recentForums", JSON.stringify(recentForums));
  };
  onGetChannelResult((result) => {
    const loadedChannel = result.data?.channels[0];
    if (!loadedChannel) {
      return;
    }
    addForumToLocalStorage(loadedChannel);
    // redirect to /discussions if we are at the channel root
    if (route.name === "forums-forumId") {
      router.push({
        name: "forums-forumId-discussions",
        params: {
          forumId: channelId.value,
        },
      });
    }
    const forumName = loadedChannel.displayName || loadedChannel.uniqueName;
    const forumDescription = loadedChannel.description
      ? loadedChannel.description.substring(0, 160) +
        (loadedChannel.description.length > 160 ? "..." : "")
      : `${forumName} - Community Forum`;
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const serverName = import.meta.env.VITE_SERVER_DISPLAY_NAME;
    const imageUrl = loadedChannel.channelIconURL || loadedChannel.channelBannerURL || "";

    // Set basic SEO meta tags
    useHead({
      title: `${forumName} | ${serverName}`,
      description: forumDescription,
      image: imageUrl,
      type: "website",
    });

    // Add structured data for rich results
    useHead({
      script: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DiscussionForumPosting",
            name: forumName,
            description: forumDescription,
            image: imageUrl,
            url: `${baseUrl}/forums/${channelId.value}`,
            publisher: {
              "@type": "Organization",
              name: serverName,
              url: baseUrl,
            },
          }),
        },
      ],
    });
  });
  const adminList = computed(() => {
    return channel.value ? channel.value.Admins.map((user: User) => user?.username) : [];
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

  definePageMeta({
    middleware: "forum-redirect",
  });
</script>

<template>
  <NuxtLayout>
    <div
      v-if="channel"
      class="flex flex-col bg-white dark:bg-black dark:text-white md:min-h-screen"
    >
      <ChannelHeaderMobile
        v-if="!showDiscussionTitle && !showEventTitle && !showIssueTitle"
        :channel="channel"
        :channel-id="channelId"
        class="block md:hidden"
      />
      <ChannelHeaderDesktop
        v-if="
          channel.channelBannerURL && !showDiscussionTitle && !showEventTitle && !showIssueTitle
        "
        :admin-list="adminList"
        :channel="channel"
        :channel-id="channelId"
        class="hidden md:block"
        :route="route"
        :show-create-button="true"
      />
      <main class="flex w-full justify-center bg-gray-100 dark:bg-gray-900">
        <article class="w-full max-w-screen-2xl rounded-lg focus:outline-none dark:bg-black">
          <div
            v-if="showDiscussionTitle"
            class="flex w-full items-start gap-2 border-b border-gray-300 px-2 dark:border-gray-600 lg:px-4 2xl:px-0"
          >
            <div class="max-w-screen-2xl flex-1 pr-1">
              <DiscussionTitleEditForm>
                <BackLink
                  :data-testid="'discussion-detail-back-link'"
                  :link="`/forums/${channelId}/discussions`"
                />
              </DiscussionTitleEditForm>
            </div>
          </div>
          <div
            v-else-if="showEventTitle"
            class="flex w-full items-start gap-2 border-b border-gray-300 px-2 dark:border-gray-600 lg:px-4 2xl:px-0"
          >
            <div class="max-w-screen-2xl flex-1 pr-1">
              <EventTitleEditForm>
                <BackLink
                  :data-testid="'event-detail-back-link'"
                  :link="`/forums/${channelId}/events`"
                />
              </EventTitleEditForm>
            </div>
          </div>
          <div
            v-else-if="showIssueTitle"
            class="flex w-full items-start gap-2 border-b border-gray-300 px-2 dark:border-gray-600 lg:px-4 2xl:px-0"
          >
            <div class="max-w-screen-2xl flex-1 pr-1">
              <IssueTitleEditForm>
                <BackLink
                  :data-testid="'issue-detail-back-link'"
                  :link="`/forums/${channelId}/issues`"
                />
              </IssueTitleEditForm>
            </div>
          </div>

          <div class="relative w-full">
            <div class="flex flex-col divide-x divide-gray-300 dark:divide-gray-500 md:flex-row">
              <div class="flex-1 bg-white p-0 dark:bg-gray-800 md:px-2">
                <ChannelTabs
                  v-if="showChannelTabs"
                  :admin-list="adminList"
                  :channel="channel"
                  class="w-full border-b border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 md:ml-2"
                  :desktop="false"
                  :route="route"
                  :show-about-tab="!showChannelSidebar"
                  :show-counts="true"
                  :vertical="false"
                />
                <NuxtPage />
              </div>
              <aside
                v-if="channelId && showChannelSidebar"
                class="flex-shrink-0 bg-white dark:bg-gray-800 md:sticky md:top-0 md:max-h-screen md:w-1/4 md:overflow-y-auto"
              >
                <ChannelSidebar
                  v-if="channel"
                  :channel="channel"
                  class="px-4"
                />
              </aside>
            </div>
          </div>
        </article>
      </main>
    </div>
  </NuxtLayout>
</template>

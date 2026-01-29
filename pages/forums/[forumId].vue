<script setup lang="ts">
import ChannelTabs from '@/components/channel/ChannelTabs.vue';
import ChannelHeaderMobile from '@/components/channel/ChannelHeaderMobile.vue';
import ChannelHeaderDesktop from '@/components/channel/ChannelHeaderDesktop.vue';
import DiscussionTitleEditForm from '@/components/discussion/detail/DiscussionTitleEditForm.vue';
import EventTitleEditForm from '@/components/event/detail/EventTitleEditForm.vue';
import IssueTitleEditForm from '@/components/mod/IssueTitleEditForm.vue';
import {
  GET_CHANNEL,
  GET_CHANNEL_DOWNLOAD_COUNT,
} from '@/graphQLData/channel/queries';
import type { Channel, User } from '@/__generated__/graphql';
import { computed } from 'vue';
import ChannelSidebar from '@/components/channel/ChannelSidebar.vue';
import { useRoute, useRouter, useHead } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import { DateTime } from 'luxon';
import BackLink from '@/components/BackLink.vue';
import PageNotFound from '@/components/PageNotFound.vue';
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from '@/utils/localStorageUtils';
import type { ForumItem } from '@/types/forum';

const route = useRoute();
const router = useRouter();

const showDiscussionTitle = computed(() =>
  route.name?.toString().includes('forums-forumId-discussions-discussionId')
);
const showDownloadTitle = computed(() =>
  route.name?.toString().includes('forums-forumId-downloads-discussionId')
);
const showEventTitle = computed(() =>
  route.name?.toString().includes('forums-forumId-events-eventId')
);
const showIssueTitle = computed(() =>
  route.name?.toString().includes('forums-forumId-issues-issueNumber')
);

const showChannelTabs = computed(() => {
  const routeName = String(route.name);
  const isCreatePage = routeName.includes('create');

  // Forum settings pages where we want to show channel tabs
  const isForumSettingsPage =
    routeName.startsWith('forums-forumId-edit') &&
    (routeName === 'forums-forumId-edit' ||
      routeName.match(
        /^forums-forumId-edit-(basic|rules|mods|owners|roles|suspended-users|suspended-mods|calendar|feedback|wiki|pipelines|plugins)$/
      ));

  // Only hide tabs for content editing (discussions, events, etc), not forum settings
  const isContentEditPage = routeName.includes('edit') && !isForumSettingsPage;

  return (
    !showDiscussionTitle.value &&
    !showDownloadTitle.value &&
    !showEventTitle.value &&
    !showIssueTitle.value &&
    !isCreatePage &&
    !isContentEditPage
  );
});

const showChannelSidebar = computed(() => {
  const routeName = String(route.name);

  // Always show sidebar on forum settings pages (including wiki settings)
  const isForumSettingsPage =
    routeName.startsWith('forums-forumId-edit') &&
    (routeName === 'forums-forumId-edit' ||
      routeName.match(
        /^forums-forumId-edit-(basic|rules|mods|owners|roles|suspended-users|suspended-mods|calendar|feedback|wiki|pipelines|plugins)$/
      ));

  if (isForumSettingsPage) {
    return true;
  }

  // Hide sidebar on wiki content pages and downloads pages to give more reading space
  // (but not wiki settings pages which are handled above)
  return (
    !routeName.includes('forums-forumId-wiki') &&
    !routeName.includes('forums-forumId-downloads')
  );
});

const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const {
  result: getChannelResult,
  onResult: onGetChannelResult,
  loading: channelLoading,
  refetch: refetchChannel,
} = useQuery(
  GET_CHANNEL,
  {
    uniqueName: channelId,
    // Using luxon, round down to the nearest hour
    now: DateTime.local().startOf('hour').toISO(),
  },
  {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    enabled: !!channelId.value,
  }
);

const channel = computed(() => {
  return getChannelResult.value?.channels?.[0] ?? null;
});

// Get download count separately since we can't query the same field twice
const { result: downloadCountResult } = useQuery(
  GET_CHANNEL_DOWNLOAD_COUNT,
  {
    uniqueName: channelId,
  },
  {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    enabled: !!channelId.value,
  }
);

const downloadCount = computed(() => {
  return (
    downloadCountResult.value?.channels?.[0]?.DiscussionChannelsAggregate
      ?.count ?? 0
  );
});

const showNotFound = computed(() => {
  // Only show 404 if query has completed and no channel was found
  return !channelLoading.value && channelId.value && !channel.value;
});

const handleRefetchChannelData = () => {
  refetchChannel();
};

const addForumToLocalStorage = (channel: Channel) => {
  if (!import.meta.client) {
    return;
  }
  let recentForums = getLocalStorageItem<ForumItem[]>('recentForums', []);

  const sideNavItem = {
    uniqueName: channelId.value,
    displayName: channel.displayName,
    channelIconURL: channel.channelIconURL,
    timestamp: Date.now(),
  };

  recentForums = recentForums.filter(
    (forum) => forum.uniqueName !== channelId.value
  );

  recentForums.unshift(sideNavItem);

  // Limit to 20 items after adding the new one
  recentForums = recentForums.slice(0, 20);

  // Clean up invalid entries
  recentForums = recentForums.filter((forum) => typeof forum === 'object');

  setLocalStorageItem('recentForums', recentForums);
};
onGetChannelResult((result) => {
  const loadedChannel = result.data?.channels[0];
  if (!loadedChannel) {
    return;
  }
  addForumToLocalStorage(loadedChannel);
  // redirect to /discussions if we are at the channel root
  if (route.name === 'forums-forumId') {
    router.push({
      name: 'forums-forumId-discussions',
      params: {
        forumId: channelId.value,
      },
    });
  }
  const forumName = loadedChannel.displayName || loadedChannel.uniqueName;
  const forumDescription = loadedChannel.description
    ? loadedChannel.description.substring(0, 160) +
      (loadedChannel.description.length > 160 ? '...' : '')
    : `${forumName} - Community Forum`;
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const serverName = import.meta.env.VITE_SERVER_DISPLAY_NAME || 'Multiforum';
  const imageUrl =
    loadedChannel.channelIconURL || loadedChannel.channelBannerURL || '';

  // Set basic SEO meta tags
  useHead({
    title: `${forumName} | ${serverName}`,
    description: forumDescription,
    image: imageUrl,
    type: 'website',
  });

  // Add structured data for rich results
  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'DiscussionForumPosting',
          name: forumName,
          description: forumDescription,
          image: imageUrl,
          url: `${baseUrl}/forums/${channelId.value}`,
          publisher: {
            '@type': 'Organization',
            name: serverName,
            url: baseUrl,
          },
        }),
      },
    ],
  });
});
const adminList = computed(() => {
  return channel.value
    ? channel.value.Admins.map((user: User) => user?.username)
    : [];
});
if (!channelId.value) {
  if (import.meta.client) {
    router.push({
      name: 'forums-forumId-discussions',
      params: {
        forumId: channelId.value,
      },
    });
  }
}

// @ts-ignore - definePageMeta is auto-imported by Nuxt
definePageMeta({
  middleware: 'forum-redirect',
});
</script>

<template>
  <NuxtLayout>
    <PageNotFound v-if="showNotFound" />
    <div
      v-else-if="channel"
      class="flex flex-col bg-white dark:bg-black dark:text-white sm:px-0 md:min-h-screen"
    >
      <ChannelHeaderMobile
        v-if="
          !showDiscussionTitle &&
          !showDownloadTitle &&
          !showEventTitle &&
          !showIssueTitle
        "
        :channel="channel"
        :channel-id="channelId"
        class="block md:hidden"
      />
      <ChannelHeaderDesktop
        v-if="
          channel.channelBannerURL &&
          !showDiscussionTitle &&
          !showDownloadTitle &&
          !showEventTitle &&
          !showIssueTitle
        "
        :admin-list="adminList"
        :channel="channel"
        :channel-id="channelId"
        class="hidden md:block"
        :route="route"
        :show-create-button="true"
      />
      <div class="flex w-full justify-center">
        <article
          class="w-full max-w-screen-2xl rounded-lg focus:outline-none dark:bg-black"
        >
          <div
            v-if="showDiscussionTitle"
            class="flex w-full items-start gap-2 border-b border-gray-300 px-4 dark:border-gray-600"
          >
            <div class="max-w-screen-2xl flex-1">
              <DiscussionTitleEditForm>
                <BackLink
                  :data-testid="'discussion-detail-back-link'"
                  :link="`/forums/${channelId}/discussions`"
                />
              </DiscussionTitleEditForm>
            </div>
          </div>
          <div
            v-else-if="showDownloadTitle"
            class="flex w-full items-start gap-2 border-b border-gray-300 px-4 dark:border-gray-600"
          >
            <div class="max-w-screen-2xl flex-1 pr-1">
              <DiscussionTitleEditForm>
                <BackLink
                  :data-testid="'download-detail-back-link'"
                  :link="`/forums/${channelId}/downloads`"
                />
              </DiscussionTitleEditForm>
            </div>
          </div>
          <div
            v-else-if="showEventTitle"
            class="flex w-full items-start gap-2 border-b border-gray-300 px-4 dark:border-gray-600"
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
            class="flex w-full items-start gap-2 border-b border-gray-300 px-4 dark:border-gray-600"
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
            <div
              class="flex flex-col divide-x divide-gray-300 dark:divide-gray-500 md:flex-row"
            >
              <div class="min-w-0 flex-1 px-4">
                <ChannelTabs
                  v-if="showChannelTabs"
                  :admin-list="adminList"
                  :channel="channel"
                  :download-count="downloadCount"
                  class="w-full border-b border-gray-300 dark:border-gray-600 md:ml-2"
                  :desktop="false"
                  :route="route"
                  :show-counts="true"
                  :vertical="false"
                />
                <NuxtPage />
              </div>
              <div
                v-if="channelId && showChannelSidebar"
                class="flex-shrink-0 md:sticky md:top-0 md:max-h-screen md:w-1/3 md:overflow-y-auto"
              >
                <ChannelSidebar
                  v-if="channel"
                  :channel="channel"
                  class="px-4"
                  @refetch-channel-data="handleRefetchChannelData"
                />
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </NuxtLayout>
</template>

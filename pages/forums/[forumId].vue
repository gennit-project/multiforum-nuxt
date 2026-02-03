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
import { computed, ref } from 'vue';
import ChannelSidebar from '@/components/channel/ChannelSidebar.vue';
import DiscussionDetailContent from '@/components/discussion/detail/DiscussionDetailContent.vue';
import { useRoute, useRouter, useHead } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import { DateTime } from 'luxon';
import BackLink from '@/components/BackLink.vue';
import PageNotFound from '@/components/PageNotFound.vue';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from '@/utils/localStorageUtils';
import type { ForumItem } from '@/types/forum';

const route = useRoute();
const router = useRouter();
const uiStore = useUIStore();
const { selectedChannelDiscussionId, selectedChannelDiscussionTitle } =
  storeToRefs(uiStore);

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
        /^forums-forumId-edit-(basic|rules|mods|owners|roles|suspended-users|suspended-mods|events|downloads|feedback|wiki-settings|pipelines|plugins(-pluginId)?)$/
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

  // Hide sidebar on forum settings pages (including wiki settings)
  const isForumSettingsPage =
    routeName.startsWith('forums-forumId-edit') &&
    (routeName === 'forums-forumId-edit' ||
      routeName.match(
        /^forums-forumId-edit-(basic|rules|mods|owners|roles|suspended-users|suspended-mods|events|downloads|feedback|wiki-settings|pipelines|plugins(-pluginId)?)$/
      ));

  if (isForumSettingsPage) {
    return false;
  }

  // Hide sidebar on wiki content pages and downloads pages to give more reading space
  // (but not wiki settings pages which are handled above)
  return (
    !routeName.includes('forums-forumId-wiki') &&
    !routeName.includes('forums-forumId-downloads')
  );
});

const showChannelDiscussionPanel = computed(() => {
  return (
    route.name === 'forums-forumId-discussions' &&
    !!selectedChannelDiscussionId.value
  );
});

const showChannelSidebarColumn = computed(() => {
  return showChannelSidebar.value && showDiscussionTitle.value;
});

const isChannelSidebarOpen = ref(false);

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
                <div class="flex items-center justify-between">
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
                  <button
                    v-if="channelId && showChannelSidebar"
                    type="button"
                    class="ml-2 hidden items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 lg:inline-flex"
                    :aria-expanded="isChannelSidebarOpen"
                    aria-controls="channel-sidebar-drawer"
                    @click="isChannelSidebarOpen = true"
                  >
                    Forum info
                  </button>
                </div>
                <NuxtPage />
              </div>
              <div
                v-if="channelId && showChannelSidebar"
                class="flex-shrink-0 md:sticky md:top-0 md:max-h-screen md:w-1/4 md:overflow-y-auto"
                :class="showChannelSidebarColumn ? 'lg:flex' : 'lg:hidden'"
                tabindex="0"
                aria-label="Forum sidebar"
              >
                <ChannelSidebar
                  v-if="channel"
                  :channel="channel"
                  class="px-4"
                  @refetch-channel-data="handleRefetchChannelData"
                />
              </div>
              <div
                v-if="showChannelDiscussionPanel"
                class="hidden lg:flex lg:w-1/2 lg:flex-col lg:overflow-y-auto"
              >
                <div
                  class="flex w-full flex-col justify-center rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div class="mb-3 flex items-start justify-between gap-3">
                    <div class="flex-1">
                      <h2
                        v-if="selectedChannelDiscussionTitle"
                        class="text-lg font-semibold text-gray-900 dark:text-gray-100"
                      >
                        {{ selectedChannelDiscussionTitle }}
                      </h2>
                    </div>
                    <a
                      :href="`/forums/${channelId}/discussions/${selectedChannelDiscussionId}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-xs font-medium text-orange-600 hover:underline dark:text-orange-400"
                    >
                      Open in new tab
                    </a>
                  </div>
                  <DiscussionDetailContent
                    :discussion-id="selectedChannelDiscussionId"
                    :channel-id="channelId"
                    class="w-full"
                  />
                </div>
              </div>
            </div>
            <div
              v-if="channelId && showChannelSidebar && isChannelSidebarOpen"
              class="fixed inset-0 z-40 hidden lg:block"
              aria-hidden="false"
            >
              <div
                class="absolute inset-0 bg-black/50"
                @click="isChannelSidebarOpen = false"
              />
              <div
                id="channel-sidebar-drawer"
                class="absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto bg-white shadow-xl dark:bg-gray-900"
                role="dialog"
                aria-label="Forum sidebar"
              >
                <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                  <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Forum info
                  </span>
                  <button
                    type="button"
                    class="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    @click="isChannelSidebarOpen = false"
                  >
                    Close
                  </button>
                </div>
                <ChannelSidebar
                  v-if="channel"
                  :channel="channel"
                  class="px-4 py-4"
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

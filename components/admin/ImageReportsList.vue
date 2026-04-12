<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { DateTime } from 'luxon';
import { GET_IMAGE_REPORTS } from '@/graphQLData/issue/queries';

const showOpenOnly = ref(true);

const { result, loading, error } = useQuery(
  GET_IMAGE_REPORTS,
  () => ({
    isOpen: showOpenOnly.value ? true : null,
  }),
  {
    fetchPolicy: 'cache-and-network',
  }
);

const imageReports = computed(() => {
  return result.value?.issues || [];
});

const toggleFilter = () => {
  showOpenOnly.value = !showOpenOnly.value;
};

// Determine image type for display
const getImageType = (report: {
  relatedImageId?: string | null;
  relatedProfilePicUserId?: string | null;
  relatedChannelIconName?: string | null;
  relatedChannelBannerName?: string | null;
}): string => {
  if (report.relatedProfilePicUserId) {
    return 'Profile Picture';
  }
  if (report.relatedChannelIconName) {
    return 'Channel Icon';
  }
  if (report.relatedChannelBannerName) {
    return 'Channel Banner';
  }
  if (report.relatedImageId) {
    return 'Album Image';
  }
  return 'Image';
};

// Get image type badge color
const getImageTypeBadgeClass = (report: {
  relatedImageId?: string | null;
  relatedProfilePicUserId?: string | null;
  relatedChannelIconName?: string | null;
  relatedChannelBannerName?: string | null;
}): string => {
  if (report.relatedProfilePicUserId) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  }
  if (report.relatedChannelIconName || report.relatedChannelBannerName) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  }
  return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
};

// Get the appropriate issue detail link based on scope
const getIssueLink = (report: {
  issueNumber: number;
  channelUniqueName?: string | null;
}): string => {
  if (report.channelUniqueName) {
    return `/forums/${report.channelUniqueName}/issues/${report.issueNumber}`;
  }
  return `/admin/issues/${report.issueNumber}`;
};
</script>

<template>
  <div class="w-full">
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600 dark:text-gray-400">
          <input
            v-model="showOpenOnly"
            type="checkbox"
            class="mr-2 rounded"
            @change="toggleFilter"
          >
          Show open reports only
        </label>
      </div>
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ imageReports.length }} report(s)
      </span>
    </div>

    <div v-if="loading" class="py-4 text-center text-gray-500">Loading...</div>

    <div v-else-if="error" class="rounded-md bg-red-50 p-4 text-red-600">
      {{ error.message }}
    </div>

    <div
      v-else-if="imageReports.length === 0"
      class="py-8 text-center text-gray-500 dark:text-gray-400"
    >
      No image reports found.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="report in imageReports"
        :key="report.id"
        class="rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                #{{ report.issueNumber }}
              </span>
              <span
                :class="[
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  getImageTypeBadgeClass(report),
                ]"
              >
                {{ getImageType(report) }}
              </span>
              <span
                v-if="report.isOpen"
                class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                Open
              </span>
              <span
                v-else
                class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                Closed
              </span>
              <span
                v-if="report.channelUniqueName"
                class="text-sm text-gray-500 dark:text-gray-400"
              >
                in
                <NuxtLink
                  :to="`/forums/${report.channelUniqueName}`"
                  class="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {{ report.channelUniqueName }}
                </NuxtLink>
              </span>
              <span
                v-else-if="report.relatedChannelUniqueName"
                class="text-sm text-gray-500 dark:text-gray-400"
              >
                ({{ report.relatedChannelUniqueName }})
              </span>
              <span
                v-else
                class="text-sm italic text-gray-400 dark:text-gray-500"
              >
                (server-scoped)
              </span>
            </div>

            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {{ report.title }}
            </p>

            <div
              class="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400"
            >
              <span>
                Reported by
                <span class="font-medium">
                  {{
                    report.Author?.__typename === 'ModerationProfile'
                      ? `@${report.Author.displayName}`
                      : report.Author?.username || 'Unknown'
                  }}
                </span>
              </span>
              <span>
                {{ DateTime.fromISO(report.createdAt).toRelative() }}
              </span>
              <span v-if="report.ActivityFeedAggregate?.count > 0">
                {{ report.ActivityFeedAggregate.count }} report(s)
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <NuxtLink
              :to="getIssueLink(report)"
              class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              View
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useHead } from 'nuxt/app';
import { usernameVar } from '@/cache';
import { GET_USER_FAVORITE_CHANNELS } from '@/graphQLData/user/queries';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import AvatarComponent from '@/components/AvatarComponent.vue';
import ExpandableImage from '@/components/ExpandableImage.vue';
import Tag from '@/components/TagComponent.vue';
import AddToChannelFavorites from '@/components/favorites/AddToChannelFavorites.vue';

useHead({
  title: 'Favorite Forums - Library',
});

const { result, loading, error } = useQuery(
  GET_USER_FAVORITE_CHANNELS,
  () => ({
    username: usernameVar.value,
  }),
  () => ({
    enabled: !!usernameVar.value,
  })
);

const favoriteChannels = computed(() => {
  return result.value?.users?.[0]?.FavoriteChannels || [];
});

const formatCount = (
  count: number | undefined,
  singular: string,
  plural: string
) => {
  const value = count || 0;
  return `${value} ${value === 1 ? singular : plural}`;
};
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-black dark:text-white">
    <RequireAuth>
      <template #has-auth>
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="py-8">
            <!-- Header with back button -->
            <div class="mb-8">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                Favorite Forums
              </h1>
              <p class="mt-2 text-gray-600 dark:text-gray-300">
                Your collection of favorite forums and communities.
              </p>
            </div>

            <!-- Loading state -->
            <div v-if="loading" class="py-8 text-center">
              <div
                class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"
              />
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                Loading your favorite forums...
              </p>
            </div>

            <!-- Error state -->
            <div
              v-else-if="error"
              class="bg-red-50 rounded-lg p-4 dark:bg-red-900/20"
            >
              <p class="text-red-800 dark:text-red-300">
                Error loading favorite forums: {{ error.message }}
              </p>
            </div>

            <!-- Empty state -->
            <div
              v-else-if="favoriteChannels.length === 0"
              class="py-12 text-center"
            >
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <h3
                class="mt-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                No favorite forums yet
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start adding forums to your favorites to see them here.
              </p>
              <div class="mt-6">
                <NuxtLink
                  to="/forums"
                  class="inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600"
                >
                  Browse Forums
                </NuxtLink>
              </div>
            </div>

            <!-- Forums grid -->
            <div v-else class="gap-4">
              <div
                v-for="channel in favoriteChannels"
                :key="channel.uniqueName"
                class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div class="flex items-start justify-between">
                  <NuxtLink
                    :to="`/forums/${channel.uniqueName}`"
                    class="flex min-w-0 flex-1 items-start space-x-4"
                  >
                    <!-- Channel Icon -->
                    <div class="flex-shrink-0">
                      <ExpandableImage
                        v-if="channel.channelIconURL"
                        :src="channel.channelIconURL"
                        :alt="channel.displayName || channel.uniqueName"
                        :rounded="true"
                        class="h-12 w-12"
                      />
                      <AvatarComponent
                        v-else
                        :text="channel.displayName || channel.uniqueName"
                        :src="''"
                        class="h-12 w-12"
                        :is-square="false"
                      />
                    </div>

                    <!-- Channel Info -->
                    <div class="min-w-0 flex-1">
                      <h3
                        class="text-lg font-medium text-gray-900 transition-colors hover:text-orange-500 dark:text-white dark:hover:text-orange-400"
                      >
                        {{ channel.displayName || channel.uniqueName }}
                      </h3>
                      <p
                        v-if="channel.displayName"
                        class="font-mono text-sm text-gray-500 dark:text-gray-400"
                      >
                        {{ channel.uniqueName }}
                      </p>
                      <p
                        v-if="channel.description"
                        class="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300"
                      >
                        {{ channel.description }}
                      </p>

                      <!-- Tags -->
                      <div
                        v-if="channel.Tags && channel.Tags.length > 0"
                        class="mt-3 flex flex-wrap gap-1"
                      >
                        <Tag
                          v-for="tag in channel.Tags.slice(0, 3)"
                          :key="tag.text"
                          :tag="tag.text"
                          class="text-xs"
                          @click.prevent=""
                        />
                        <span
                          v-if="channel.Tags.length > 3"
                          class="text-xs text-gray-500 dark:text-gray-400"
                        >
                          +{{ channel.Tags.length - 3 }} more
                        </span>
                      </div>
                    </div>
                  </NuxtLink>

                  <!-- Favorites Button -->
                  <div class="ml-4 flex-shrink-0">
                    <AddToChannelFavorites
                      :channel-unique-name="channel.uniqueName"
                      :channel-display-name="channel.displayName || ''"
                      size="medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #does-not-have-auth>
        <div class="mx-auto max-w-md py-12 text-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Sign In Required
          </h1>
          <p class="mt-4 text-gray-600 dark:text-gray-300">
            Please sign in to view your favorite forums.
          </p>
        </div>
      </template>
    </RequireAuth>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

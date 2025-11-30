<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter, useHead } from 'nuxt/app';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { useQuery } from '@vue/apollo-composable';
import PencilIcon from '@/components/icons/PencilIcon.vue';
import DocumentIcon from '@/components/icons/DocumentIcon.vue';
import GenericButton from '@/components/GenericButton.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import OnThisPage from '@/components/wiki/OnThisPage.vue';
import FontSizeControl from '@/components/channel/FontSizeControl.vue';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';
import { timeAgo } from '@/utils';

const route = useRoute();
const router = useRouter();
const forumId = route.params.forumId as string;
const uiStore = useUIStore();
const { fontSize } = storeToRefs(uiStore);

// Query channel data (includes WikiHomePage and wikiEnabled)
const {
  result: channelResult,
  loading,
  error,
} = useQuery(GET_CHANNEL, { uniqueName: forumId }, { errorPolicy: 'all' });

// Computed property for the channel data
const channel = computed(() => channelResult.value?.channels[0]);

// Check if wiki is enabled
const wikiEnabled = computed(() => channel.value?.wikiEnabled);

// Get wiki home page from channel relationship
const wikiHomePage = computed(() => channel.value?.WikiHomePage);

// Check if we have a wiki home page already
const hasWikiHomePage = computed(() => !!wikiHomePage.value);

// Navigate to create wiki page
function createWikiPage() {
  router.push(`/forums/${forumId}/wiki/create`);
}

// SEO metadata setup
const { onResult: onGetChannelResult } = useQuery(
  GET_CHANNEL,
  { uniqueName: forumId },
  { errorPolicy: 'all' }
);

onGetChannelResult((result) => {
  try {
    if (!result?.data?.channels) {
      return;
    }
    if (result.data.channels.length === 0) {
      // Handle the case where the channel is not found
      useHead({
        title: `Wiki Not Found${forumId ? ` | ${forumId}` : ''}`,
        meta: [
          {
            name: 'description',
            content: 'The requested wiki could not be found.',
          },
          { name: 'robots', content: 'noindex' },
        ],
      });
      return;
    } else {
      const channel = result.data.channels[0];
      const wikiHomePage = channel.WikiHomePage;
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const serverName = import.meta.env.VITE_SERVER_DISPLAY_NAME;
      const pageUrl = `${baseUrl}/forums/${forumId}/wiki`;

      if (!channel.wikiEnabled) {
        // Wiki is disabled
        useHead({
          title: `Wiki Disabled | ${forumId} | ${serverName}`,
          meta: [
            {
              name: 'description',
              content: `The wiki feature is not enabled for ${forumId}.`,
            },
            { name: 'robots', content: 'noindex' },
          ],
        });
        return;
      }

      if (!wikiHomePage) {
        // No wiki home page exists yet
        const title = `${forumId} Wiki`;
        const description = `Create and explore wiki pages for ${forumId} on ${serverName}`;

        useHead({
          title: `${title} | ${serverName}`,
          meta: [
            { name: 'description', content: description },

            // OpenGraph tags
            { property: 'og:title', content: title },
            { property: 'og:description', content: description },
            { property: 'og:type', content: 'website' },
            { property: 'og:url', content: pageUrl },
            { property: 'og:site_name', content: serverName },

            // Twitter Card tags
            { name: 'twitter:card', content: 'summary' },
            { name: 'twitter:title', content: title },
            { name: 'twitter:description', content: description },

            // Additional meta tags for wiki pages
            { name: 'article:section', content: 'Wiki' },
            { name: 'article:tag', content: 'wiki' },
          ],
          script: [
            {
              type: 'application/ld+json',
              children: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: title,
                description: description,
                url: pageUrl,
                publisher: {
                  '@type': 'Organization',
                  name: serverName,
                },
                mainEntityOfPage: {
                  '@type': 'WebPage',
                  '@id': pageUrl,
                },
                keywords: ['wiki', forumId],
              }),
            },
          ],
        });
      } else {
        // Wiki home page exists
        const title = wikiHomePage.title || `${forumId} Wiki`;
        const description = wikiHomePage.body
          ? wikiHomePage.body.substring(0, 160) +
            (wikiHomePage.body.length > 160 ? '...' : '')
          : `Explore the wiki for ${forumId} on ${serverName}`;

        useHead({
          title: `${title} | ${forumId} Wiki | ${serverName}`,
          meta: [
            { name: 'description', content: description },

            // OpenGraph tags
            { property: 'og:title', content: title },
            { property: 'og:description', content: description },
            { property: 'og:type', content: 'article' },
            { property: 'og:url', content: pageUrl },
            { property: 'og:site_name', content: serverName },

            // Twitter Card tags
            { name: 'twitter:card', content: 'summary' },
            { name: 'twitter:title', content: title },
            { name: 'twitter:description', content: description },

            // Additional meta tags for wiki pages
            { name: 'article:section', content: 'Wiki' },
            { name: 'article:tag', content: 'wiki' },
          ],
          script: [
            {
              type: 'application/ld+json',
              children: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: title,
                description: description,
                author: {
                  '@type': 'Person',
                  name:
                    wikiHomePage.VersionAuthor?.displayName ||
                    wikiHomePage.VersionAuthor?.username ||
                    'Anonymous',
                },
                datePublished: wikiHomePage.createdAt,
                dateModified: wikiHomePage.updatedAt || wikiHomePage.createdAt,
                publisher: {
                  '@type': 'Organization',
                  name: serverName,
                },
                mainEntityOfPage: {
                  '@type': 'WebPage',
                  '@id': pageUrl,
                },
                articleSection: 'Wiki',
                keywords: ['wiki', forumId, title],
              }),
            },
          ],
        });
      }
    }
  } catch (error) {
    console.error('Error setting wiki index SEO metadata:', error);
  }
});
</script>

<template>
  <div>
    <div v-if="loading" class="flex items-center justify-center p-8">
      <LoadingSpinner size="lg" />
    </div>

    <div
      v-else-if="error"
      class="mx-auto max-w-2xl rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900 dark:text-red-200"
    >
      <p>Sorry, there was an error loading the wiki data.</p>
      <p class="mt-2 text-sm">{{ error.message }}</p>
    </div>

    <div
      v-else-if="!wikiEnabled"
      class="mx-auto max-w-2xl p-4 text-center dark:text-white"
    >
      <p>The wiki feature is not enabled for this forum.</p>
    </div>

    <div
      v-else-if="!hasWikiHomePage"
      class="mx-auto max-w-2xl p-8 text-center dark:text-white"
    >
      <div class="mb-6 text-gray-600 dark:text-gray-300">
        <p class="text-lg">
          You don't have any wiki pages yet.
          <span
            class="cursor-pointer text-orange-600 hover:underline dark:text-orange-400"
            @click="createWikiPage"
            >Add one?</span
          >
        </p>
      </div>
      <RequireAuth>
        <template #has-auth>
          <GenericButton :text="'Create Wiki Page'" @click="createWikiPage">
            <DocumentIcon class="mr-2 h-5 w-5" />
          </GenericButton>
        </template>
        <template #does-not-have-auth>
          <GenericButton :text="'Create Wiki Page'">
            <DocumentIcon class="mr-2 h-5 w-5" />
          </GenericButton>
        </template>
      </RequireAuth>
    </div>

    <div v-else class="mx-auto max-w-full p-4">
      <!-- Wiki Home Page Content -->
      <div class="mb-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold dark:text-white">
            {{ wikiHomePage.title }}
          </h1>
          <div class="flex space-x-3">
            <RequireAuth>
              <template #has-auth>
                <GenericButton
                  :text="'Add Page'"
                  @click="router.push(`/forums/${forumId}/wiki/create-child`)"
                >
                  <DocumentIcon class="mr-2 h-5 w-5" />
                </GenericButton>
              </template>
              <template #does-not-have-auth>
                <GenericButton :text="'Add Page'">
                  <DocumentIcon class="mr-2 h-5 w-5" />
                </GenericButton>
              </template>
            </RequireAuth>
            <RequireAuth>
              <template #has-auth>
                <GenericButton
                  :text="'Edit Wiki'"
                  @click="
                    router.push(
                      `/forums/${forumId}/wiki/edit/${wikiHomePage.slug}`
                    )
                  "
                >
                  <PencilIcon class="mr-2 h-5 w-5" />
                </GenericButton>
              </template>
              <template #does-not-have-auth>
                <GenericButton :text="'Edit Wiki'">
                  <PencilIcon class="mr-2 h-5 w-5" />
                </GenericButton>
              </template>
            </RequireAuth>
          </div>
        </div>
        <div
          class="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400"
        >
          <span>
            Last updated by
            {{ wikiHomePage.VersionAuthor?.username || 'Unknown' }}
            {{
              timeAgo(
                new Date(wikiHomePage.updatedAt || wikiHomePage.createdAt)
              )
            }}
          </span>

          <!-- Show see edits link if there are past versions -->
          <template
            v-if="
              wikiHomePage.PastVersions && wikiHomePage.PastVersions.length > 0
            "
          >
            <span class="mx-2">·</span>
            <router-link
              :to="`/forums/${forumId}/wiki/revisions/${wikiHomePage.slug}`"
              class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              See edits
            </router-link>
          </template>
        </div>
      </div>

      <!-- Mobile On This Page Dropdown -->
      <div class="mb-4 block xl:hidden">
        <OnThisPage :markdown-content="wikiHomePage.body" :is-mobile="true" />
      </div>

      <!-- Mobile font size control -->
      <div class="mb-4 block xl:hidden">
        <FontSizeControl />
      </div>

      <div class="flex flex-col gap-6 xl:flex-row">
        <!-- Main content - first on mobile/tablet, middle on desktop -->
        <div class="min-w-0 flex-1 xl:order-2">
          <MarkdownRenderer :text="wikiHomePage.body" :font-size="fontSize" />

          <!-- Bottom edit button - Docusaurus style -->
          <div class="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
            <button
              class="flex items-center text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              @click="
                router.push(`/forums/${forumId}/wiki/edit/${wikiHomePage.slug}`)
              "
            >
              <PencilIcon class="mr-2 h-4 w-4" />
              Edit this page
            </button>
          </div>
        </div>

        <!-- Left sidebar - On This Page (desktop only) -->
        <div
          class="sticky top-0 hidden max-h-screen w-64 flex-shrink-0 overflow-y-auto xl:order-1 xl:flex"
        >
          <!-- On This Page Navigation -->
          <OnThisPage :markdown-content="wikiHomePage.body" :is-mobile="false" />
        </div>

        <!-- Right sidebar - controls and more pages (desktop only) -->
        <div
          class="sticky top-0 hidden max-h-screen w-64 flex-shrink-0 overflow-y-auto xl:order-3 xl:flex"
        >
          <div class="w-full space-y-6 py-2">
            <FontSizeControl />

            <!-- Child Pages - shown in right sidebar at xl screens -->
            <div
              v-if="wikiHomePage.ChildPages && wikiHomePage.ChildPages.length > 0"
              class="w-full"
            >
              <h3
                class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                More Wiki Pages
              </h3>
              <div class="space-y-1">
                <div
                  v-for="childPage in wikiHomePage.ChildPages"
                  :key="childPage.id"
                  class="group"
                >
                  <a
                    :href="`/forums/${forumId}/wiki/${childPage.slug}`"
                    class="hover:bg-orange-50 block rounded px-1 py-0.5 text-xs font-medium text-orange-600 transition-colors hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
                    @click.prevent="
                      router.push(`/forums/${forumId}/wiki/${childPage.slug}`)
                    "
                  >
                    {{ childPage.title }}
                  </a>
                  <p class="ml-1 text-xs text-gray-500 dark:text-gray-400">
                    Updated
                    {{
                      timeAgo(
                        new Date(childPage.updatedAt || childPage.createdAt)
                      )
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile More Wiki Pages - shown below main content on small/medium screens -->
      <div
        v-if="wikiHomePage.ChildPages && wikiHomePage.ChildPages.length > 0"
        class="mt-8 block xl:hidden"
      >
        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800">
          <h3
            class="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            More Wiki Pages
          </h3>
          <div class="space-y-3">
            <div
              v-for="childPage in wikiHomePage.ChildPages"
              :key="childPage.id"
              class="group"
            >
              <a
                :href="`/forums/${forumId}/wiki/${childPage.slug}`"
                class="hover:bg-orange-50 block rounded px-3 py-2 text-sm font-medium text-orange-600 transition-colors hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
                @click.prevent="
                  router.push(`/forums/${forumId}/wiki/${childPage.slug}`)
                "
              >
                {{ childPage.title }}
              </a>
              <p class="ml-3 text-xs text-gray-500 dark:text-gray-400">
                Updated
                {{
                  timeAgo(
                    new Date(childPage.updatedAt || childPage.createdAt)
                  )
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

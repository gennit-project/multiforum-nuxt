<script setup lang="ts">
import { computed } from 'vue';
import { useDisplay } from 'vuetify';
import HamburgerMenuButton from '@/components/nav/HamburgerMenuButton.vue';
import UserProfileDropdownMenu from '@/components/nav/UserProfileDropdownMenu.vue';
import ThemeSwitcher from '@/components/nav/ThemeSwitcher.vue';
import CreateAnythingButton from '@/components/nav/CreateAnythingButton.vue';
import AddToChannelFavorites from '@/components/favorites/AddToChannelFavorites.vue';
import TopNavSearch from '@/components/nav/TopNavSearch.vue';
// import LogoIcon from "@/components/icons/LogoIcon.vue"; // Unused for now
import { useRoute } from 'nuxt/app';
import LoginButton from './LoginButton.vue';
import {
  modProfileNameVar,
  usernameVar,
  sideNavIsOpenVar,
  notificationCountVar,
} from '@/cache';

defineEmits(['toggleDropdown']);

const route = useRoute();
const { smAndDown } = useDisplay();

const channelId = computed(() =>
  typeof route.params.forumId === 'string' ? route.params.forumId : ''
);

const shouldShowChannelId = computed(() => channelId.value);

const routeInfoLabel = computed(() => {
  if (
    typeof route.name === 'string' &&
    route.name.indexOf('map-search') !== -1
  ) {
    return 'in-person events';
  }

  switch (route.name) {
    case 'discussions':
      return 'discussions';
    case 'downloads':
      return 'downloads';
    case 'events-list-search':
      return 'online events';
    case 'forums':
      return 'forums';
    default:
      return '';
  }
});

function getLabel() {
  if (route.name === 'SitewideSearchDiscussionPreview') return '• discussions';
  if (route.name === 'SearchEventsList') return '• online events';
  if (route.name === 'MapEventPreview') return '• in-person events';
  if (typeof route.name === 'string' && route.name.includes('admin'))
    return '• admin dashboard';
  return '';
}

const isOnMapPage = computed(() => {
  if (route.name && typeof route.name === 'string') {
    return route.name.includes('map');
  }
  return false;
});
</script>

<template>
  <nav
    class="z-20 h-14 border-b border-b-gray-200 bg-gray-100 pr-4 dark:border-b-gray-600 dark:bg-gray-900 lg:ml-20"
    :class="[isOnMapPage ? 'fixed w-full lg:w-[calc(100%-5rem)]' : '']"
    aria-label="Top navigation"
  >
    <div class="flex items-center justify-between py-2 pl-12 pr-2 lg:pl-2">
      <div class="flex min-w-0 items-center overflow-hidden">
        <HamburgerMenuButton
          v-if="!sideNavIsOpenVar"
          data-testid="menu-button"
          class="fixed-menu-button cursor-pointer md:ml-1 lg:hidden"
          @click="$emit('toggleDropdown')"
        />

        <div class="ml-2 flex min-w-0 items-center space-x-1 text-sm">
          <nuxt-link to="/" class="flex items-center gap-1">
            <span
              class="logo-font text-lg font-bold text-gray-900 dark:text-white"
              >Topical</span
            >
          </nuxt-link>

          <div
            v-if="shouldShowChannelId"
            class="hidden items-center gap-1 text-gray-600 dark:text-gray-300 sm:flex"
          >
            <span>•</span>
            <nuxt-link
              :to="`/forums/${channelId}`"
              class="max-w-[8rem] truncate text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white sm:max-w-[12rem] lg:max-w-[16rem]"
            >
              {{ channelId }}
            </nuxt-link>
            <AddToChannelFavorites
              :channel-unique-name="channelId"
              :allow-add-to-list="true"
              size="small"
              class="ml-1"
            />
          </div>
          <div
            v-else-if="routeInfoLabel"
            class="hidden items-center gap-1 truncate text-gray-600 dark:text-gray-300 sm:flex"
          >
            <span>•</span>
            {{ routeInfoLabel }}
          </div>
          <div
            v-else
            class="hidden items-center gap-1 truncate text-gray-600 dark:text-gray-300 sm:flex"
          >
            {{ getLabel() }}
          </div>
        </div>
      </div>
      <ClientOnly>
        <div
          v-if="!smAndDown"
          class="hidden min-w-0 flex-1 justify-center px-4 md:flex"
        >
          <div class="w-full min-w-0 max-w-xl">
            <TopNavSearch />
          </div>
        </div>
        <template #fallback>
          <div
            class="hidden min-w-0 flex-1 justify-center px-4 md:flex"
            aria-hidden="true"
          />
        </template>
      </ClientOnly>
      <div class="flex flex-none items-center gap-2">
        <div class="hidden items-center justify-end space-x-4 sm:flex">
          <nuxt-link
            to="/about"
            class="font-semibold text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            About
          </nuxt-link>
          <LoginButton />
        </div>
        <div class="flex items-center space-x-2 md:mr-2">
          <ClientOnly>
            <div v-if="smAndDown" class="md:hidden">
              <TopNavSearch icon-only />
            </div>
            <template #fallback>
              <div class="md:hidden" aria-hidden="true" />
            </template>
          </ClientOnly>
          <div class="lg:hidden">
            <CreateAnythingButton :background-color="'light'" />
          </div>
          <nuxt-link
            data-testid="notification-bell"
            to="/notifications"
            aria-label="Notifications"
            class="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:text-gray-900 focus:outline-none dark:text-gray-300 dark:hover:text-white"
          >
            <i class="fas fa-bell text-lg" aria-hidden="true" />
            <span
              v-if="notificationCountVar > 0"
              class="font-semibold absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-xs leading-none text-white"
            >
              {{ notificationCountVar }}
            </span>
          </nuxt-link>
          <ThemeSwitcher />
          <div v-if="usernameVar" class="block">
            <div class="flex items-center">
              <div class="relative flex-shrink-0">
                <UserProfileDropdownMenu
                  :username="usernameVar"
                  :mod-name="modProfileNameVar"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.fixed-menu-button {
  position: fixed; /* Makes the button stay in the same place on the screen */
  top: 6px; /* Distance from the top of the viewport */
  left: 10px; /* Distance from the left of the viewport */
  z-index: 20; /* Ensures the button is above other content */
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import { config } from '@/config';
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
import { sideNavIsOpenVar } from '@/cache';
import {
  useModProfileName,
  useUsername,
  useNotificationCount,
} from '@/composables/useAuthState';

const modProfileNameVar = useModProfileName();
const usernameVar = useUsername();
const notificationCountVar = useNotificationCount();

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
    class="top-nav-shell relative z-20 h-14 border-y border-white/10 bg-gray-100 pr-4 text-white dark:bg-gray-900 lg:ml-20"
    :class="[isOnMapPage ? 'fixed w-full lg:w-[calc(100%-5rem)]' : '']"
    aria-label="Top navigation"
  >
    <div class="flex h-full items-center justify-between pl-14 pr-3 lg:px-5">
      <div class="flex min-w-0 items-center overflow-hidden">
        <HamburgerMenuButton
          v-if="!sideNavIsOpenVar"
          data-testid="menu-button"
          class="fixed-menu-button cursor-pointer md:ml-1 lg:hidden"
          @click="$emit('toggleDropdown')"
        />

        <div class="ml-2 flex h-full min-w-0 items-center gap-2 text-sm lg:gap-3">
          <nuxt-link to="/" class="flex h-full items-center gap-1.5">
            <h1
              class="logo-font text-[1.2rem] font-semibold leading-none tracking-[-0.04em] text-gray-900 dark:text-white lg:text-[1.3rem]"
            >
              {{ config.serverDisplayName }}
            </h1>
          </nuxt-link>

          <div
            v-if="shouldShowChannelId"
            class="hidden h-full items-center gap-2 text-base leading-none tracking-[-0.02em] text-gray-700 sm:flex dark:text-gray-300"
          >
            <span class="inline-flex h-5 items-center self-center text-lg leading-none text-gray-500 dark:text-gray-400">•</span>
            <nuxt-link
              :to="`/forums/${channelId}`"
              class="inline-flex h-5 -translate-y-px items-center self-center max-w-[8rem] truncate leading-none text-gray-700 transition-colors hover:text-gray-950 sm:max-w-[12rem] lg:max-w-[16rem] dark:text-gray-300 dark:hover:text-white"
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
            class="hidden h-full items-center gap-2 truncate text-base leading-none tracking-[-0.02em] text-gray-700 sm:flex dark:text-gray-300"
          >
            <span class="inline-flex h-5 items-center self-center text-lg leading-none text-gray-500 dark:text-gray-400">•</span>
            <span class="inline-flex h-5 -translate-y-px items-center self-center leading-none">
              {{ routeInfoLabel }}
            </span>
          </div>
          <div
            v-else
            class="hidden h-full items-center gap-1 truncate text-base leading-none tracking-[-0.02em] text-gray-700 sm:flex dark:text-gray-300"
          >
            <span class="inline-flex h-5 items-center self-center leading-none">
              {{ getLabel() }}
            </span>
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
        <div class="hidden items-center justify-end gap-7 lg:flex">
          <nuxt-link
            to="/about"
            class="inline-flex items-center px-1 py-1 text-base leading-none font-medium tracking-[-0.02em] text-gray-700 transition-colors hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"
          >
            About
          </nuxt-link>
          <LoginButton />
        </div>
        <div class="flex items-center gap-2 md:mr-2">
          <ClientOnly>
            <div v-if="smAndDown" class="md:hidden">
              <TopNavSearch icon-only />
            </div>
            <template #fallback>
              <div class="md:hidden" aria-hidden="true" />
            </template>
          </ClientOnly>
          <div class="hidden lg:block">
            <CreateAnythingButton :background-color="'dark'" />
          </div>
          <div class="lg:hidden">
            <CreateAnythingButton :background-color="'light'" />
          </div>
          <nuxt-link
            data-testid="notification-bell"
            to="/notifications"
            :aria-label="notificationCountVar > 0 ? `${notificationCountVar} new notifications` : 'Notifications'"
            class="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-950 focus:outline-none dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <i class="fa-regular fa-bell text-lg" aria-hidden="true" />
            <span
              v-if="notificationCountVar > 0"
              aria-hidden="true"
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
.top-nav-shell {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05);
}

.fixed-menu-button {
  position: absolute;
  top: 50%;
  left: 10px;
  z-index: 20;
  transform: translateY(-50%);
}
</style>

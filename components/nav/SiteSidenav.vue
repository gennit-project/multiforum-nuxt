<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import type { RouteLocationAsRelativeGeneric } from 'vue-router';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import CalendarIcon from '@/components/icons/CalendarIcon.vue';
import LocationIcon from '@/components/icons/LocationIcon.vue';
import DiscussionIcon from '@/components/icons/DiscussionIcon.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';
import XIcon from '@/components/icons/XmarkIcon.vue';
import { GET_USER } from '@/graphQLData/user/queries';
import { useDisplay } from 'vuetify';
import CreateAnythingButton from './CreateAnythingButton.vue';
import { usernameVar, isAuthenticatedVar, setSideNavIsOpenVar } from '@/cache';
import SiteSidenavLogout from './SiteSidenavLogout.vue';

const DEFAULT_LIMIT = 5;

type NavigationItem = {
  name: string;
  href: string;
  icon: any;
  routerName: string;
};

const navigation: NavigationItem[] = [
  {
    name: 'Online Events',
    href: '/events/list/search',
    icon: CalendarIcon,
    routerName: 'events-list-search',
  },
  {
    name: 'In-person Events',
    href: '/map/search',
    icon: LocationIcon,
    routerName: 'map-search',
  },
  {
    name: 'Discussions',
    href: '/discussions',
    icon: DiscussionIcon,
    routerName: 'discussions',
  },
  {
    name: 'All Forums',
    href: '/forums',
    icon: ChannelIcon,
    routerName: 'forums',
  },
];

defineProps({
  showDropdown: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['close']);

const showAllForums = ref(false);

const recentForums = computed(() => {
  if (!import.meta.client) {
    return [];
  }
  const forums = JSON.parse(localStorage.getItem('recentForums') || '""') || [];
  return forums.sort((a: any, b: any) => b.timestamp - a.timestamp);
});

const visibleRecentForums = computed(() => {
  return showAllForums.value
    ? recentForums.value
    : recentForums.value.slice(0, DEFAULT_LIMIT);
});

const { result: getUserResult } = useQuery(
  GET_USER,
  {
    username: usernameVar.value,
  },
  {
    enabled: !!usernameVar.value,
  }
);

const user = computed(() => getUserResult.value?.users[0] || null);

const profilePicURL = computed(() => user.value?.profilePicURL || '');

const { smAndDown } = useDisplay();

const router = useRouter();

const outside = () => {
  emit('close');
};

const navLinkClasses =
  'pl-6 font-semibold group flex items-center gap-x-3 rounded-md py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700';

const routeAndClose = async (route: RouteLocationAsRelativeGeneric) => {
  try {
    await router.push(route);
    setSideNavIsOpenVar(false);
  } catch (error) {
    console.error('Navigation error:', error);
  }
};
</script>

<template>
  <div v-if="showDropdown" class="side-nav-override">
    <div
      class="top fixed inset-0 bg-gray-100 opacity-50 dark:bg-gray-900 dark:text-gray-200"
      @click="outside"
    />
    <div
      v-click-outside="outside"
      class="overlay-shade fixed left-0 top-0 flex h-full w-[275px] flex-col justify-between overflow-y-auto border-gray-300 bg-white py-2 dark:border-gray-200 dark:bg-gray-900"
    >
      <div>
        <div class="mt-2 block px-6">
          <div class="flex h-7">
            <button
              type="button"
              class="rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-gray-200"
              @click="outside"
            >
              <span class="sr-only">Close panel</span>
              <XIcon class="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div class="flex justify-end">
          <CreateAnythingButton v-if="smAndDown" class="mb-4 px-6" />
        </div>
        <nav class="mt-4">
          <ul role="list" class="m-0 p-0">
            <li
              v-for="item in navigation"
              :key="item.name"
              class="m-0 list-none"
            >
              <nuxt-link
                :to="item.href"
                :data-testid="`nav-link-${item.name}`"
                :class="navLinkClasses"
                @click.prevent="
                  () => {
                    routeAndClose({
                      name: item.routerName,
                    });
                  }
                "
              >
                <component
                  :is="item.icon"
                  class="list-item-icon h-6 w-6 shrink-0 dark:text-orange-500"
                  aria-hidden="true"
                />
                {{ item.name }}
              </nuxt-link>
            </li>
          </ul>
        </nav>
      </div>
      <div
        v-if="recentForums.length > 0"
        class="border-t border-gray-200 dark:border-gray-600"
      >
        <div
          class="text-bold mb-2 mt-3 px-6 text-sm uppercase leading-6 text-gray-400 dark:text-gray-100"
        >
          Recent Forums
        </div>
        <nav>
          <ul role="list" class="m-0 p-0">
            <li
              v-for="forum in visibleRecentForums"
              :key="forum.uniqueName"
              class="m-0 list-none"
            >
              <nuxt-link
                :to="{
                  name: 'forums-forumId-discussions',
                  params: { forumId: forum.uniqueName },
                }"
                :class="navLinkClasses"
                @click.prevent="
                  () => {
                    routeAndClose({
                      name: 'forums-forumId-discussions',
                      params: { forumId: forum.uniqueName },
                    });
                  }
                "
              >
                <AvatarComponent
                  v-if="forum?.channelIconURL"
                  class="list-item-icon border-1 h-8 w-8 shrink-0 border-gray-200 shadow-sm dark:border-gray-800"
                  :text="forum.uniqueName || ''"
                  :src="forum?.channelIconURL ?? ''"
                  :is-small="true"
                  :is-square="false"
                />
                <AvatarComponent
                  v-if="!forum?.channelIconURL"
                  class="list-item-icon border-1 h-8 w-8 shrink-0 border-gray-200 shadow-sm dark:border-gray-800"
                  :text="forum.uniqueName || ''"
                  :src="forum?.channelIconURL ?? ''"
                  :is-small="true"
                  :is-square="false"
                />
                {{ forum.uniqueName }}
              </nuxt-link>
            </li>
          </ul>
          <div v-if="recentForums.length > DEFAULT_LIMIT">
            <button
              v-if="!showAllForums"
              class="px-4 text-sm text-gray-500 underline dark:text-white"
              @click="showAllForums = true"
            >
              Show All
            </button>
            <button
              v-else
              class="px-4 text-sm text-gray-500 underline dark:text-white"
              @click="showAllForums = false"
            >
              Show Less
            </button>
          </div>
        </nav>
      </div>
      <ul role="list" class="m-0 mb-6 mt-6 border-t p-0 pt-4">
        <nuxt-link
          v-if="isAuthenticatedVar && usernameVar"
          :to="{
            name: 'u-username',
            params: { username: usernameVar },
          }"
          class="font-semibold group flex items-center gap-x-3 rounded-md px-6 py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
          @click.prevent="
            () => {
              routeAndClose({
                name: 'u-username',
                params: { username: usernameVar },
              });
            }
          "
        >
          <AvatarComponent
            v-if="profilePicURL"
            :text="usernameVar"
            :src="profilePicURL"
            :is-small="true"
          />
          My Profile
        </nuxt-link>
        <nuxt-link
          v-if="isAuthenticatedVar && usernameVar"
          to="/account_settings"
          :class="navLinkClasses"
          @click.prevent="
            () => {
              routeAndClose({
                name: 'account_settings',
              });
            }
          "
        >
          Account Settings
        </nuxt-link>
        <nuxt-link
          :to="{
            name: 'admin-issues',
          }"
          :class="navLinkClasses"
          @click.prevent="
            () => {
              routeAndClose({
                name: 'admin-issues',
              });
            }
          "
        >
          Admin Dashboard
        </nuxt-link>

        <RequireAuth :require-ownership="false" :full-width="true">
          <template #has-auth>
            <SiteSidenavLogout :nav-link-classes="`w-full ${navLinkClasses}`" />
          </template>
          <template #does-not-have-auth>
            <button
              v-if="!isAuthenticatedVar"
              :class="`w-full ${navLinkClasses}`"
            >
              Log In
            </button>
          </template>
        </RequireAuth>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
nav li:hover,
.list-item-icon {
  color: #9ca3af;
}
.top {
  z-index: 1000;
}
.overlay-shade {
  z-index: 1001;
}
</style>

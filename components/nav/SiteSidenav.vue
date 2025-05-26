<script setup lang="ts">
  import { ref, computed } from "vue";
  import { useRouter } from "nuxt/app";
  import { useQuery } from "@vue/apollo-composable";
  import type { RouteLocationAsRelativeGeneric } from "vue-router";
  import RequireAuth from "@/components/auth/RequireAuth.vue";
  import CalendarIcon from "@/components/icons/CalendarIcon.vue";
  import LocationIcon from "@/components/icons/LocationIcon.vue";
  import DiscussionIcon from "@/components/icons/DiscussionIcon.vue";
  import ChannelIcon from "@/components/icons/ChannelIcon.vue";
  import XIcon from "@/components/icons/XmarkIcon.vue";
  import AvatarComponent from "@/components/AvatarComponent.vue";
  import { GET_USER } from "@/graphQLData/user/queries";
  import CreateAnythingButton from "./CreateAnythingButton.vue";
  import { usernameVar, isAuthenticatedVar, setSideNavIsOpenVar } from "@/cache";
  import SiteSidenavLogout from "./SiteSidenavLogout.vue";

  const DEFAULT_LIMIT = 5;

  type NavigationItem = {
    name: string;
    href: string;
    icon: any;
    routerName: string;
  };

  const navigation: NavigationItem[] = [
    {
      name: "Online Events",
      href: "/events/list/search",
      icon: CalendarIcon,
      routerName: "events-list-search",
    },
    {
      name: "In-person Events",
      href: "/map/search",
      icon: LocationIcon,
      routerName: "map-search",
    },
    {
      name: "Discussions",
      href: "/discussions",
      icon: DiscussionIcon,
      routerName: "discussions",
    },
    {
      name: "All Forums",
      href: "/forums",
      icon: ChannelIcon,
      routerName: "forums",
    },
  ];

  defineProps({
    showDropdown: {
      type: Boolean,
      required: true,
    },
  });

  const emit = defineEmits(["close"]);

  const showAllForums = ref(false);

  const recentForums = computed(() => {
    if (!import.meta.client) {
      return [];
    }
    const forums = JSON.parse(localStorage.getItem("recentForums") || '""') || [];
    return forums.sort((a: any, b: any) => b.timestamp - a.timestamp);
  });

  const visibleRecentForums = computed(() => {
    return showAllForums.value ? recentForums.value : recentForums.value.slice(0, DEFAULT_LIMIT);
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

  const profilePicURL = computed(() => user.value?.profilePicURL || "");

  // Use a simple window width check
  const smAndDown = ref(false);
  if (import.meta.client) {
    smAndDown.value = window.innerWidth < 640;
    window.addEventListener("resize", () => {
      smAndDown.value = window.innerWidth < 640;
    });
  }

  const router = useRouter();

  const outside = () => {
    emit("close");
  };

  const navLinkClasses =
    "pl-6 font-semibold group flex items-center gap-x-3 rounded-md py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700";

  const routeAndClose = async (route: RouteLocationAsRelativeGeneric) => {
    try {
      await router.push(route);
      setSideNavIsOpenVar(false);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };
</script>

<template>
  <div
    v-if="showDropdown"
    class="side-nav-override"
  >
    <div
      class="top fixed inset-0 bg-gray-100 opacity-50 dark:bg-gray-900 dark:text-gray-200"
      @click="outside"
    />
    <div
      v-click-outside="outside"
      class="overlay-shade fixed left-0 top-0 flex h-full w-[275px] flex-col justify-between overflow-y-auto border-gray-300 bg-white py-2 dark:border-gray-300 dark:bg-gray-900"
    >
      <div>
        <div class="mt-2 block px-6">
          <div class="flex h-7">
            <button
              class="rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-gray-200"
              type="button"
              @click="outside"
            >
              <span class="sr-only">Close panel</span>
              <XIcon
                aria-hidden="true"
                class="h-6 w-6"
              />
            </button>
          </div>
        </div>
        <div class="flex justify-end">
          <CreateAnythingButton
            v-if="smAndDown"
            class="mb-4 px-6"
          />
        </div>
        <nav class="mt-4">
          <ul
            class="m-0 p-0"
            role="list"
          >
            <li
              v-for="item in navigation"
              :key="item.name"
              class="m-0 list-none"
            >
              <nuxt-link
                :class="navLinkClasses"
                :data-testid="`nav-link-${item.name}`"
                :to="item.href"
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
                  aria-hidden="true"
                  class="list-item-icon h-6 w-6 shrink-0 dark:text-orange-500"
                />
                {{ item.name }}
              </nuxt-link>
            </li>
          </ul>
        </nav>
      </div>
      <div
        v-if="recentForums.length > 0"
        class="border-t border-gray-300 dark:border-gray-600"
      >
        <div
          class="text-bold mb-2 mt-3 px-6 text-sm uppercase leading-6 text-gray-400 dark:text-gray-100"
        >
          Recent Forums
        </div>
        <nav>
          <ul
            class="m-0 p-0"
            role="list"
          >
            <li
              v-for="forum in visibleRecentForums"
              :key="forum.uniqueName"
              class="m-0 list-none"
            >
              <nuxt-link
                :class="navLinkClasses"
                :to="{
                  name: 'forums-forumId-discussions',
                  params: { forumId: forum.uniqueName },
                }"
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
                  class="list-item-icon border-1 h-8 w-8 shrink-0 border-gray-300 shadow-sm dark:border-gray-300"
                  :is-small="true"
                  :is-square="false"
                  :src="forum?.channelIconURL ?? ''"
                  :text="forum.uniqueName || ''"
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
      <ul
        class="m-0 mb-6 mt-6 border-t p-0 pt-4"
        role="list"
      >
        <nuxt-link
          v-if="isAuthenticatedVar && usernameVar"
          class="font-semibold group flex items-center gap-x-3 rounded-md px-6 py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
          :to="{
            name: 'u-username',
            params: { username: usernameVar },
          }"
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
            :is-small="true"
            :src="profilePicURL"
            :text="usernameVar"
          />
          My Profile
        </nuxt-link>
        <nuxt-link
          v-if="isAuthenticatedVar && usernameVar"
          :class="navLinkClasses"
          :to="{
            name: 'u-username-settings',
            params: { username: usernameVar },
          }"
          @click.prevent="
            () => {
              routeAndClose({
                name: 'u-username-settings',
                params: { username: usernameVar },
              });
            }
          "
        >
          Account Settings
        </nuxt-link>
        <nuxt-link
          :class="navLinkClasses"
          :to="{
            name: 'admin-issues',
          }"
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

        <RequireAuth
          :full-width="true"
          :require-ownership="false"
        >
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

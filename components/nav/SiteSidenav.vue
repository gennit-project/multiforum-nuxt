<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import CalendarIcon from "@/components/icons/CalendarIcon.vue";
import LocationIcon from "@/components/icons/LocationIcon.vue";
import DiscussionIcon from "@/components/icons/DiscussionIcon.vue";
import ChannelIcon from "@/components/icons/ChannelIcon.vue";
import UserCircle from "@/components/icons/UserCircle.vue";
import XIcon from "@/components/icons/XmarkIcon.vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_LOCAL_USERNAME, GET_USER } from "@/graphQLData/user/queries";
import clickOutside from "vue-click-outside";
import { useDisplay } from "vuetify";
import CreateAnythingButton from "./CreateAnythingButton.vue";
import ExpandableImage from "../ExpandableImage.vue";
import config from '@/config'

const DEFAULT_LIMIT = 5;

type NavigationItem = {
  name: string;
  href: string;
  icon: any;
};

const navigation: NavigationItem[] = [
  {
    name: "Online Events",
    href: "/events/list/search",
    icon: CalendarIcon,
  },
  {
    name: "In-person Events",
    href: "/map",
    icon: LocationIcon,
  },
  {
    name: "Discussions",
    href: "/discussions",
    icon: DiscussionIcon,
  },
  { name: "All Forums", href: "/channels", icon: ChannelIcon },
];

export default defineComponent({
  directives: {
    clickOutside,
  },
  components: {
    CalendarIcon,
    CreateAnythingButton,
    ExpandableImage,
    LocationIcon,
    DiscussionIcon,
    ChannelIcon,
    XIcon,
    UserCircle,
  },
  props: {
    showDropdown: {
      type: Boolean,
      required: true,
    },
  },
  setup() {
    const showAllForums = ref(false);
    const { isAuthenticated, logout, loginWithRedirect } = useAuth0();

    const recentForums = computed(() => {
      const forums = (
        JSON.parse(localStorage.getItem("recentForums") || '""') || []
      )
        .sort((a: any, b: any) => a.timestamp - b.timestamp)
        .reverse();
      return forums;
    });

    const visibleRecentForums = computed(() => {
      if (showAllForums.value) return recentForums.value;

      return recentForums.value.slice(0, DEFAULT_LIMIT);
    });

    JSON.parse(localStorage.getItem("recentForums") || '""') || [];

    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      const username = localUsernameResult.value?.username;
      if (username) {
        return username;
      }
      return "";
    });

    const { result: getUserResult } = useQuery(GET_USER, {
      username: username.value || "",
    });

    const user = computed(() => {
      const user = getUserResult.value?.users[0];
      if (user) {
        return user;
      }
      return null;
    });

    const profilePicURL = computed(() => {
      const profilePicURL = user.value?.profilePicURL;
      if (profilePicURL) {
        return profilePicURL;
      }
      return "";
    });

    const { smAndDown } = useDisplay();

    return {
      defaultLimit: DEFAULT_LIMIT,
      isAuthenticated,
      login: () => {
        loginWithRedirect();
      },
      logout: () => {
        logout({ returnTo: config.baseUrl });
      },
      navigation,
      username,
      profilePicURL,
      recentForums,
      smAndDown,
      showAllForums,
      visibleRecentForums,
    };
  },
  methods: {
    outside() {
      this.$emit("close");
    },
  },
});
</script>
<template>
  <div v-if="showDropdown">
    <!-- Overlay (shadow) for the rest of the UI -->
    <div
      class="fixed inset-0 top bg-gray-100 opacity-50 dark:bg-gray-900 dark:text-gray-200"
      @click="$emit('close')"
    />

    <div
      v-click-outside="outside"
      class="fixed left-0 top-0 overlay-shade flex h-full w-[275px] flex-col justify-between overflow-y-auto border-gray-300 bg-white py-2 dark:border-gray-200 dark:bg-gray-900"
    >
      <div>
        <div class="mt-2 block px-6">
          <div class="flex h-7">
            <button
              type="button"
              class="rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
              @click="$emit('close')"
            >
              <span class="sr-only">Close panel</span>
              <XIcon
                class="h-6 w-6"
                aria-hidden="true"
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
          <ul role="list">
            <li
              v-for="item in navigation"
              :key="item.name"
              class="px-6 list-none"
            >
              <router-link
                :to="item.href"
                :data-testid="`nav-link-${item.name}`"
                class="font-semibold group flex gap-x-3 rounded-md py-1 pl-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                @click="$emit('close')"
              >
                <component
                  :is="item.icon"
                  class="list-item-icon h-6 w-6 shrink-0 dark:text-blue-500"
                  aria-hidden="true"
                />
                {{ item.name }}
              </router-link>
            </li>
          </ul>
        </nav>
      </div>
      <div
        v-if="recentForums.length > 0"
        class="border-t border-gray-200 dark:border-gray-600"
      >
        <div
          class="text-bold mt-3 px-6 uppercase leading-6 text-gray-400 dark:text-gray-100"
        >
          Recent Forums
        </div>
        <div class="px-6">
          <ul class="mb-6">
            <li
              v-for="forum in visibleRecentForums"
              :key="forum.uniqueName"
              class="list-none"
            >
              <router-link
                :to="{
                  name: 'SearchDiscussionsInChannel',
                  params: { channelId: forum.uniqueName },
                }"
                class="font-semibold group flex items-center gap-x-3 rounded-md py-1 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                @click="$emit('close')"
              >
                <Avatar
                  v-if="forum?.channelIconURL"
                  class="list-item-icon border-1 h-8 w-8 shrink-0 border-gray-200 shadow-sm dark:border-gray-800"
                  :text="forum.uniqueName || ''"
                  :src="forum?.channelIconURL ?? ''"
                  :is-medium="true"
                  :is-square="false"
                />
                <Avatar
                  v-if="!forum?.channelIconURL"
                  class="list-item-icon border-1 h-8 w-8 shrink-0 border-gray-200 shadow-sm dark:border-gray-800"
                  :text="forum.uniqueName || ''"
                  :src="forum?.channelIconURL ?? ''"
                  :is-medium="true"
                  :is-square="false"
                />
                {{ forum.uniqueName }}
              </router-link>
            </li>
          </ul>
          <div v-if="recentForums.length > defaultLimit">
            <button
              v-if="!showAllForums"
              @click="showAllForums = true"
            >
              Show All
            </button>
            <button
              v-else
              @click="showAllForums = false"
            >
              Show Less
            </button>
          </div>
        </div>
      </div>

      <ul class="mb-6 border-t">
        <router-link
          v-if="isAuthenticated && username"
          :to="`/u/${username}`"
          class="font-semibold group flex items-center gap-x-3 rounded-md px-6 py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
          @click="$emit('close')"
        >
          <Avatar
            v-if="profilePicURL"
            :text="username"
            :src="profilePicURL"
            :is-small="true"
          />
          My Profile
        </router-link>
        <router-link
          v-if="isAuthenticated"
          :to="`/u/${username}/settings`"
          class="font-semibold group flex items-center gap-x-3 rounded-md px-6 py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
          @click="$emit('close')"
        >
          Account Settings
        </router-link>
        <button
          v-if="!isAuthenticated"
          class="font-semibold group flex gap-x-3 rounded-md px-6 py-2 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
          @click="login"
        >
          Log In
        </button>
        <router-link
          v-if="isAuthenticated"
          data-testid="sign-out-link"
          to="/logout"
          class="font-semibold group flex gap-x-3 rounded-md py-2 pl-6 text-sm leading-6 text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
          @click="logout"
        >
          Sign Out
        </router-link>
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

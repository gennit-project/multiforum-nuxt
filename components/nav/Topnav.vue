<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import HamburgerMenuButton from "@/components/nav/MenuButton.vue";
import UserProfileDropdownMenu from "@/components/nav/UserProfileDropdownMenu.vue";
import ThemeSwitcher from "./ThemeSwitcher.vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { useQuery } from "@vue/apollo-composable";
import {
  GET_LOCAL_USERNAME,
  GET_LOCAL_MOD_PROFILE_NAME,
} from "@/graphQLData/user/queries";
import { useRoute } from "vue-router";
import CreateAnythingButton from "./CreateAnythingButton.vue";
import { useRouter } from "vue-router";
import ArrowUpBoldBox from "vue-material-design-icons/ArrowUpBoldBox.vue";
import { useDisplay } from "vuetify";
// import SearchButton from "./SearchButton.vue";

export default defineComponent({
  name: "TopNav",
  components: {
    CreateAnythingButton,
    ThemeSwitcher,
    HamburgerMenuButton,
    UserProfileDropdownMenu,
    ArrowUpBoldBox,
    // SearchButton
  },
  props: {
    sideNavIsOpen: {
      type: Boolean,
      required: true,
    },
  },
  setup() {
    const { isAuthenticated, loginWithPopup, loginWithRedirect } = useAuth0();
    const route = useRoute();
    const router = useRouter();
    const { smAndDown } = useDisplay();

    const { result } = useQuery(GET_LOCAL_USERNAME);
    const username = computed(() => {
      let username = result.value?.username;
      if (username) {
        return username;
      }
      return "";
    });

    const channelId = computed(() => {
      if (typeof route.params.channelId !== "string") {
        return "";
      }
      return route.params.channelId;
    });

    const { result: modNameResult } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

    const modName = computed(() => {
      let modName = modNameResult.value?.modProfileName;
      if (modName) {
        return modName;
      }
      return "";
    });

    return {
      channelId,
      isAuthenticated,
      login: () => {
        if (window.parent.Cypress) {
          // Cypress cannot test popups. It has to stay
          // in the same window.
          loginWithRedirect();
        } else {
          loginWithPopup();
        }
      },
      modName,
      route,
      router,
      username,
      showCreateMenu: ref(false),
      smAndDown,
    };
  },
  computed: {
    shouldShowChannelId() {
      return this.channelId;
    },
    shouldShowRouteInfo() {
      return (
        this.route.name === "MapView" || this.route.name === "SearchChannels"
      );
    },
    routeInfoLabel() {
      if (this.route.name === "MapView") {
        return "events map";
      } else if (this.route.name === "SearchChannels") {
        return "Forums";
      }
      return "";
    },
  },
  methods: {
    getLabel() {
      if (this.route.name === "SitewideSearchDiscussionPreview") {
        return "• discussions";
      }
      if (this.route.name === "SearchEventsList") {
        return "• online events";
      }
      if (this.route.name === "MapEventPreview") {
        return "• in-person events";
      }
    },
  },
});
</script>

<template>
  <div class="z-10 w-full bg-gray-100 border-b dark:bg-black dark:border-b-gray-600">
    <div
      :class="[smAndDown ? 'px-2 py-2' : 'px-4 py-1']"
      class="flex items-center justify-between"
    >
      <div class="flex items-center lg:px-0">
        <HamburgerMenuButton
          v-if="!sideNavIsOpen"
          data-testid="menu-button"
          class="cursor-pointer fixed-menu-button"
          @click="$emit('toggleDropdown')"
        />
        <div
          class="flex items-center space-x-1 ml-12 text-sm text-gray-500 dark:text-white"
        >
          <router-link
            to="/"
            class="flex gap-2 items-center"
          >
            <arrow-up-bold-box
              :size="38"
              class="text-black dark:text-blue-500"
            />
            <span class="font-bold text-black dark:text-white">Topical</span>
            <span class="text-blue-500 text-xs py-0.5 px-1 border rounded-md border-blue-500 dark:text-blue-500">ALPHA</span>
          </router-link>
          <div
            v-if="shouldShowChannelId && !smAndDown"
            class="flex items-center gap-1"
          >
            <span>•</span>
            <span class="font-mono text-gray-800 dark:text-gray-300">{{
              channelId
            }}</span>
          </div>
          <div
            v-else-if="shouldShowRouteInfo && !smAndDown"
            class="flex items-center gap-1"
          >
            <span>•</span>
            {{ routeInfoLabel }}
          </div>
          <div
            v-else-if="!smAndDown"
            class="flex items-center gap-1"
          >
            {{ getLabel() }}
          </div>
        </div>
      </div>
      <div
        v-if="!smAndDown"
        class="flex items-center justify-end space-x-2 md:flex md:flex-1"
      >
        <button
          v-if="!isAuthenticated"
          data-testid="login-button"
          class="font-medium mr-2 inline-flex items-center rounded-full px-3 py-1 text-xs text-gray-400 hover:dark:text-white hover:text-black"
          @click="login"
        >
          Log In
        </button>
      </div>
      <div class="flex items-center space-x-2">
        <!-- <SearchButton /> -->
        <CreateAnythingButton />
        <ThemeSwitcher />
        <div
          v-if="isAuthenticated && username"
          class="hidden lg:ml-4 lg:block"
        >
          <div class="flex items-center">
            <!-- <NotificationButton/> -->
            <div class="relative flex-shrink-0">
              <UserProfileDropdownMenu
                :username="username"
                :mod-name="modName"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.fixed-menu-button {
  position: fixed;  /* Makes the button stay in the same place on the screen */
  top: 6px;       /* Distance from the top of the viewport */
  left: 10px;      /* Distance from the left of the viewport */
  z-index: 19;    /* Ensures the button is above other content */
}
</style>
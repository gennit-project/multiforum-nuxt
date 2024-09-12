<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRoute } from "vue-router";
import { GET_USER , GET_LOCAL_MOD_PROFILE_NAME } from "@/graphQLData/user/queries";
import { useQuery } from "@vue/apollo-composable";
import { relativeTime } from "@/utils";
import gql from "graphql-tag";
import { useDisplay } from "vuetify";
import UserProfileTabs from "./UserProfileTabs.vue";
import UserProfileSidebar from "./UserProfileSidebar.vue";
import type { User } from "@/__generated__/graphql";

export default defineComponent({
  components: {
    UserProfileSidebar,
    UserProfileTabs,
  },
  setup() {
    const route = useRoute();

    const {
      result: localModProfileNameResult,
      loading: localModProfileNameLoading,
      error: localModProfileNameError,
    } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

    const GET_THEME = gql`
      query getTheme {
        theme @client
      }
    `;

    const {
      result: themeResult,
      loading: themeLoading,
      error: themeError,
    } = useQuery(GET_THEME);

    const theme = computed(() => {
      if (themeLoading.value || themeError.value) {
        return "";
      }
      return themeResult.value.theme;
    });

    const loggedInUserModName = computed(() => {
      if (localModProfileNameLoading.value || localModProfileNameError.value) {
        return "";
      }
      return localModProfileNameResult.value?.modProfileName || "";
    });

    const username = computed(() => {
      if (typeof route.params.username === "string") {
        return route.params.username;
      }
      return "";
    });

    const { result, loading, error } = useQuery(GET_USER, {
      username: username.value,
    },{
      // Prevents 'user not found' if new user looks at their profile
      // in the first session.
      fetchPolicy: "network-only",
    });

    // Returns type User or null
    const user = computed<User | null>(() => {
      if (loading.value || error.value) {
        return null;
      }
      if (result.value && result.value.users.length > 0) {
        return result.value.users[0];
      }
      return null;
    });

    const isAdmin = computed(() => {
      if (user.value) {
        const serverRole = user.value.ServerRoles?.[0];
        return serverRole?.showAdminTag;
      }
      return false;
    });

    const links = computed(() => {
      return [
        {
          label: username.value,
          path: `u/${username.value}`,
        },
      ];
    });

    const { smAndDown } = useDisplay();

    return {
      error,
      isAdmin,
      links,
      loading,
      loggedInUserModName,
      relativeTime,
      result,
      route,
      theme,
      smAndDown,
      user,
      username,
    };
  },
});
</script>

<template>
  <v-container class="max-w-7xl dark:bg-black">
    <div
      v-if="smAndDown"
      :class="[
        theme === 'dark' ? 'channel-background-dark' : 'channel-background',
      ]"
      class="h-24 w-full object-cover lg:h-28"
      alt="background pattern"
    />
    <div
      v-if="smAndDown"
      class="flex flex-col justify-center"
    >
      <AvatarComponent
        class="-mt-24 mb-4 h-24 w-24 shadow-sm border"
        :text="username"
        :src="user?.profilePicURL"
        :is-medium="true"
      />
      <div class="mb-6">
        <div v-if="user?.displayName">
          {{ user.displayName }} 
        </div>
        <div
          :class="[
            user?.displayName ? 'text-sm' : 'text-lg',
            user?.displayName
              ? 'text-gray-500 dark:text-gray-300'
              : 'text-gray-700 dark:text-gray-200',
          ]"
        >
          {{ `u/${username}` }}
        </div>
      </div>
      <!-- <NuxtLink
        v-if="loggedInUserModName"
        class="text-sm text-gray-500 underline dark:text-gray-300"
        :to="{
          name: 'mod-profile',
          params: { modProfileName: loggedInUserModName },
        }"
      >
        Go to mod profile
      </NuxtLink> -->
    </div>
    <div class="dark:bg-gray-950">
      <article class="relative z-0 flex-1 focus:outline-none xl:order-last">
        <v-container
          fluid
          class="p-0"
        >
          <v-row class="flex flex-row gap-3">
            <v-col
              v-if="!smAndDown"
              cols="3"
              class="p-0"
            >
              <UserProfileSidebar :is-admin="isAdmin" />
            </v-col>
            <v-col
              :class="[!smAndDown ? 'pt-6' : '']"
              :cols="!smAndDown ? 8 : 12"
              class="rounded-lg bg-gray-100 dark:bg-gray-900"
            >
              <UserProfileTabs
                v-if="user"
                :show-counts="true"
                :vertical="false"
                :user="user"
                class="block border-b border-gray-200 dark:border-gray-600"
                :route="route"
              />
              <NuxtPage />
            </v-col>
          </v-row>
        </v-container>
      </article>
    </div>
  </v-container>
</template>
<style lang="scss">
.user-background {
  background-color: #4474c0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 152 152'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='temple' fill='%23efefef' fill-opacity='0.4'%3E%3Cpath d='M152 150v2H0v-2h28v-8H8v-20H0v-2h8V80h42v20h20v42H30v8h90v-8H80v-42h20V80h42v40h8V30h-8v40h-42V50H80V8h40V0h2v8h20v20h8V0h2v150zm-2 0v-28h-8v20h-20v8h28zM82 30v18h18V30H82zm20 18h20v20h18V30h-20V10H82v18h20v20zm0 2v18h18V50h-18zm20-22h18V10h-18v18zm-54 92v-18H50v18h18zm-20-18H28V82H10v38h20v20h38v-18H48v-20zm0-2V82H30v18h18zm-20 22H10v18h18v-18zm54 0v18h38v-20h20V82h-18v20h-20v20H82zm18-20H82v18h18v-18zm2-2h18V82h-18v18zm20 40v-18h18v18h-18zM30 0h-2v8H8v20H0v2h8v40h42V50h20V8H30V0zm20 48h18V30H50v18zm18-20H48v20H28v20H10V30h20V10h38v18zM30 50h18v18H30V50zm-2-40H10v18h18V10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
.tippy-box[data-animation="fade"][data-state="hidden"] {
  opacity: 0;
}
[data-tippy-root] {
  max-width: calc(100vw - 10px);
}
.tippy-box {
  position: relative;
  background-color: #333;
  color: #fff;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.4;
  white-space: normal;
  outline: 0;
  transition-property: transform, visibility, opacity;
}
.tippy-box[data-placement^="top"] > .tippy-arrow {
  bottom: 0;
}
.tippy-box[data-placement^="top"] > .tippy-arrow:before {
  bottom: -7px;
  left: 0;
  border-width: 8px 8px 0;
  border-top-color: initial;
  transform-origin: center top;
}
.tippy-box[data-placement^="bottom"] > .tippy-arrow {
  top: 0;
}
.tippy-box[data-placement^="bottom"] > .tippy-arrow:before {
  top: -7px;
  left: 0;
  border-width: 0 8px 8px;
  border-bottom-color: initial;
  transform-origin: center bottom;
}
.tippy-box[data-placement^="left"] > .tippy-arrow {
  right: 0;
}
.tippy-box[data-placement^="left"] > .tippy-arrow:before {
  border-width: 8px 0 8px 8px;
  border-left-color: initial;
  right: -7px;
  transform-origin: center left;
}
.tippy-box[data-placement^="right"] > .tippy-arrow {
  left: 0;
}
.tippy-box[data-placement^="right"] > .tippy-arrow:before {
  left: -7px;
  border-width: 8px 8px 8px 0;
  border-right-color: initial;
  transform-origin: center right;
}
.tippy-box[data-inertia][data-state="visible"] {
  transition-timing-function: cubic-bezier(0.54, 1.5, 0.38, 1.11);
}
.tippy-arrow {
  width: 16px;
  height: 16px;
  color: #333;
}
.tippy-arrow:before {
  content: "";
  position: absolute;
  border-color: transparent;
  border-style: solid;
}
.tippy-content {
  position: relative;
  padding: 5px 9px;
  z-index: 1;
}
.tippy-box[data-placement^="top"] > .tippy-svg-arrow {
  bottom: 0;
}
.tippy-box[data-placement^="top"] > .tippy-svg-arrow:after,
.tippy-box[data-placement^="top"] > .tippy-svg-arrow > svg {
  top: 16px;
  transform: rotate(180deg);
}
.tippy-box[data-placement^="bottom"] > .tippy-svg-arrow {
  top: 0;
}
.tippy-box[data-placement^="bottom"] > .tippy-svg-arrow > svg {
  bottom: 16px;
}
.tippy-box[data-placement^="left"] > .tippy-svg-arrow {
  right: 0;
}
.tippy-box[data-placement^="left"] > .tippy-svg-arrow:after,
.tippy-box[data-placement^="left"] > .tippy-svg-arrow > svg {
  transform: rotate(90deg);
  top: calc(50% - 3px);
  left: 11px;
}
.tippy-box[data-placement^="right"] > .tippy-svg-arrow {
  left: 0;
}
.tippy-box[data-placement^="right"] > .tippy-svg-arrow:after,
.tippy-box[data-placement^="right"] > .tippy-svg-arrow > svg {
  transform: rotate(-90deg);
  top: calc(50% - 3px);
  right: 11px;
}
.tippy-svg-arrow {
  width: 16px;
  height: 16px;
  fill: #333;
  text-align: initial;
}
.tippy-svg-arrow,
.tippy-svg-arrow > svg {
  position: absolute;
}
.vch__container .vch__legend {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.vch__container .vch__external-legend-wrapper {
  margin: 0 8px;
}
svg.vch__wrapper {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    Segoe UI,
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    Open Sans,
    Helvetica Neue,
    sans-serif;
  line-height: 10px;
  width: 100%;
}
svg.vch__wrapper .vch__months__labels__wrapper text.vch__month__label {
  font-size: 10px;
}
svg.vch__wrapper .vch__days__labels__wrapper text.vch__day__label,
svg.vch__wrapper .vch__legend__wrapper text {
  font-size: 9px;
}
svg.vch__wrapper text.vch__month__label,
svg.vch__wrapper text.vch__day__label,
svg.vch__wrapper .vch__legend__wrapper text {
  fill: #767676;
}
svg.vch__wrapper rect.vch__day__square:hover {
  stroke: #555;
  stroke-width: 2px;
  paint-order: stroke;
}
svg.vch__wrapper rect.vch__day__square:focus {
  outline: none;
}
svg.vch__wrapper.dark-mode text.vch__month__label,
svg.vch__wrapper.dark-mode text.vch__day__label,
svg.vch__wrapper.dark-mode .vch__legend__wrapper text {
  fill: #fff;
}
</style>

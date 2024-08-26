<script lang="ts">
import { defineComponent, computed } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import IconButtonDropdown from "@/components/IconButtonDropdown.vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_USER } from "@/graphQLData/user/queries";
import config from '@/config'

export default defineComponent({
  name: "UserProfileDropdownMenu",
  components: {
    IconButtonDropdown,
  },
  props: {
    modName: {
      type: String,
      default: "",
    },
    username: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { isAuthenticated, logout } = useAuth0();
    const { result: getUserResult } = useQuery(GET_USER, {
      username: props.username || "",
    });

    const user = computed(() => {
      let user = getUserResult.value?.users[0];
      if (user) {
        return user;
      }
      return null;
    });

    const profilePicURL = computed(() => {
      if (user.value && user.value.profilePicURL) {
        return user.value.profilePicURL;
      }
      return "";
    });

    let menuItems = [
      {
        label: "My Profile",
        value: `/u/${props.username}`,
      },
      {
        label: "Account Settings",
        value: `/u/${props.username}/settings`,
      },
      {
        label: "Sign out",
        value: "",
        event: "logout",
      },
    ];

    return {
      isAuthenticated,
      logout: () => {
        logout({ returnTo: config.logoutUrl });
      },
      menuItems,
      profilePicURL,
    };
  },
  methods: {
    goToModProfile() {
      this.$router.push(`/mod/${this.modName}`);
    },
    goToUserProfile() {
      this.$router.push(`/u/${this.username}/comments`);
    },
  },
});
</script>
<template>
  <IconButtonDropdown
    :items="menuItems"
    @logout="logout"
    @goToUserProfile="goToUserProfile"
    @goToModProfile="goToModProfile"
  >
    <Avatar
      :key="profilePicURL"
      :text="username"
      :src="profilePicURL"
      :is-small="true"
    />
  </IconButtonDropdown>
</template>

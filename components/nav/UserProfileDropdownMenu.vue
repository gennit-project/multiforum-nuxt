<script lang="ts" setup>
import { computed } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_USER } from "@/graphQLData/user/queries";
import config from "@/config";

const props = defineProps({
  modName: {
    type: String,
    default: "",
  },
  username: {
    type: String,
    required: true,
  },
});
const { logout } = useAuth0();
const { result: getUserResult } = useQuery(GET_USER, {
  username: props.username || "",
});

const user = computed(() => {
  const fetchedUser = getUserResult.value?.users[0];
  return fetchedUser || null;
});

const profilePicURL = computed(() => {
  return user.value?.profilePicURL || "";
});

const router = useRouter();

const menuItems = [
  {
    label: "My Profile",
    value: `/u/${props.username}`,
    icon: ''
  },
  {
    label: "Account Settings",
    value: `/u/${props.username}/settings`,
    icon: ''
  },
  {
    label: "Sign out",
    value: "",
    event: "logout",
    icon: ''
  },
];

const handleLogout = () => {
  logout({ returnTo: config.logoutUrl });
};

const goToModProfile = () => {
  router.push(`/mod/${props.modName}`);
};

const goToUserProfile = () => {
  router.push(`/u/${props.username}/comments`);
};
</script>

<template>
  <IconButtonDropdown
    :items="menuItems"
    @logout="handleLogout"
    @go-to-user-profile="goToUserProfile"
    @go-to-mod-profile="goToModProfile"
  >
    <AvatarComponent
      :key="profilePicURL"
      :text="username"
      :src="profilePicURL"
      :is-small="true"
    />
  </IconButtonDropdown>
</template>

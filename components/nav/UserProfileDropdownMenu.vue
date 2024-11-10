<script lang="ts" setup>
import { computed } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { usernameVar } from "@/cache";
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


const user = computed(() => {
  const fetchedUser = usernameVar.value;
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
    icon: "",
  },
  {
    label: "Account Settings",
    value: `/u/${props.username}/settings`,
    icon: "",
  },
  {
    label: "Sign out",
    value: "",
    event: "logout",
    icon: "",
  },
];

const route = useRoute();

const handleLogout = () => {
  console.log('base url', config.baseUrl);
  // Store the current path in local storage
  localStorage.setItem("postLogoutRedirect", route.fullPath);
  // Redirect to the fixed logout route
  logout({
    logoutParams: {
      returnTo: `${config.baseUrl}/logout`,
    },
  });
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

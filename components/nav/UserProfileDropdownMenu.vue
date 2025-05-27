<script lang="ts" setup>
import { computed } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { usernameVar } from "@/cache";
import { config } from "@/config";
import { useRouter, useRoute } from "nuxt/app";
import { useQuery } from "@vue/apollo-composable";
import { GET_USER } from "@/graphQLData/user/queries";

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
  username: usernameVar.value,
},{
  enabled: !!usernameVar.value,
});

const profilePicURL = computed(() => {
  return getUserResult.value?.users[0]?.profilePicURL || "";
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
  // Store the current path in local storage
  localStorage.setItem("postLogoutRedirect", route.fullPath);
  // Redirect to the fixed logout route
  logout({
    logoutParams: {
      returnTo: `${config.baseUrl}/logout`,
    },
  });
};

<<<<<<< HEAD
  const { result: getUserResult } = useQuery(
    GET_USER,
    {
      username: usernameVar.value || "",
    },
    {
      enabled: !!usernameVar.value && !!props.username,
    }
  );

  const profilePicURL = computed(() => {
    if (!getUserResult.value?.users?.length) return "";
    return getUserResult.value.users[0]?.profilePicURL || "";
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
=======
const goToModProfile = () => {
  router.push(`/mod/${props.modName}`);
};

const goToUserProfile = () => {
  router.push(`/u/${props.username}/comments`);
};
>>>>>>> parent of 666ae3d (Use automated formatting tools)
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

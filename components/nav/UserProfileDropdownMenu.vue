<script lang="ts" setup>
import { computed } from 'vue';
import { useUsername } from '@/composables/useAuthState';
import { useRouter } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import { GET_USER } from '@/graphQLData/user/queries';
import { useServerLogout } from '@/composables/useServerLogout';

const usernameVar = useUsername();

const props = defineProps({
  modName: {
    type: String,
    default: '',
  },
  username: {
    type: String,
    required: true,
  },
});
// SPIKE Phase 3: logout goes through the server-session route, not the SPA SDK.
const { logout: handleLogout } = useServerLogout();

const { result: getUserResult } = useQuery(
  GET_USER,
  {
    username: usernameVar.value || '',
  },
  {
    enabled: !!usernameVar.value && !!props.username,
  }
);

const profilePicURL = computed(() => {
  if (!getUserResult.value?.users?.length) return '';
  return getUserResult.value.users[0]?.profilePicURL || '';
});
const router = useRouter();

const menuItems = [
  {
    label: 'My Profile',
    value: `/u/${props.username}`,
    icon: '',
  },
  {
    label: 'Account Settings',
    value: '/account_settings',
    icon: '',
  },
  {
    label: 'Sign out',
    value: '',
    event: 'logout',
    icon: '',
  },
];

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
    aria-label="User profile menu"
    @go-to-mod-profile="goToModProfile"
    @go-to-user-profile="goToUserProfile"
    @logout="handleLogout"
  >
    <AvatarComponent
      :key="profilePicURL"
      :is-small="true"
      :src="profilePicURL"
      :text="username"
    />
  </IconButtonDropdown>
</template>

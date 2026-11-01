<script setup lang="ts">
import { GetBasicUserInfoDocument as GET_USER } from '@/__generated__/operations';
import AvatarComponent from '../AvatarComponent.vue';
import { useQuery } from '@vue/apollo-composable';
import { computed } from 'vue';
import { useUsername } from '@/composables/useAuthState';

const usernameVar = useUsername();

const { result: getUserResult } = useQuery(
  GET_USER,
  {
    username: usernameVar.value,
  },
  {
    enabled: !!usernameVar.value,
  }
);

const profilePicURL = computed(() => {
  return getUserResult.value?.users?.[0]?.profilePicURL || '';
});

const user = computed(() => getUserResult.value?.users?.[0] || null);
</script>

<template>
  <AvatarComponent
    class="h-8 w-8"
    :text="usernameVar"
    :src="profilePicURL"
    :variant-source="user"
    :is-small="true"
  />
</template>

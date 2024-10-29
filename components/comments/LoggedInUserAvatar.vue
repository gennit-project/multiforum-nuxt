<script setup lang="ts">
import { GET_USER } from "@/graphQLData/user/queries";
import AvatarComponent from "../AvatarComponent.vue";
import { usernameVar } from "@/cache";

const { result: getUserResult } = useQuery(GET_USER, {
  username: usernameVar.value,
});

const profilePicURL = computed(() => {
  return getUserResult.value?.users[0]?.profilePicURL || "";
});
</script>

<template>
  <AvatarComponent
    class="h-8 w-8"
    :text="usernameVar"
    :src="profilePicURL"
    :is-small="true"
  />
</template>

<script setup lang="ts">
  import { GET_USER } from "@/graphQLData/user/queries";
  import AvatarComponent from "../AvatarComponent.vue";
  import { usernameVar } from "@/cache";
  import { useQuery } from "@vue/apollo-composable";
  import { computed } from "vue";

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
    return getUserResult.value?.users[0]?.profilePicURL || "";
  });
</script>

<template>
  <AvatarComponent
    class="h-8 w-8"
    :is-small="true"
    :src="profilePicURL"
    :text="usernameVar"
  />
</template>

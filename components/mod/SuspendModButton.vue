<script lang="ts" setup>
import { useQuery } from "@vue/apollo-composable";
import {
  GET_SUSPENDED_MODS_BY_CHANNEL,
} from "@/graphQLData/mod/queries";
import { computed } from "vue";

const props = defineProps({
  channelUniqueName: {
    type: String,
    required: true,
  },
  authorModProfileName: {
    type: String,
    required: true,
  },
});

const {
  result: getModSuspensionResult,
  loading: getModSuspensionLoading,
  error: getModSuspensionError,
  // refetch: refetchModSuspension
} = useQuery(GET_SUSPENDED_MODS_BY_CHANNEL, {
  channelUniqueName: props.channelUniqueName,
});

const modIsSuspendedFromChannel = computed(() => {
  if (getModSuspensionLoading.value || getModSuspensionError.value)
    return false;
  const suspendedMods = getModSuspensionResult.value?.channels?.[0]?.SuspendedMods || [];
  return suspendedMods.some((suspendedMod: any) => 
    suspendedMod.SuspendedMod?.displayName === props.authorModProfileName
  );
});
</script>

<template>

    <div v-if="!modIsSuspendedFromChannel">SuspendModButton</div>
    <div v-else>UnsuspendModButton</div>
</template>
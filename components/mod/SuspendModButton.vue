<script lang="ts" setup>
  import { useQuery } from "@vue/apollo-composable";
  import { GET_MOD_SUSPENSION } from "@/graphQLData/mod/queries";
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
  } = useQuery(GET_MOD_SUSPENSION, {
    channelUniqueName: props.channelUniqueName,
    modProfileName: props.authorModProfileName,
  });

  const modIsSuspendedFromChannel = computed(() => {
    if (getModSuspensionLoading.value || getModSuspensionError.value) return false;
    return getModSuspensionResult.value?.channels[0].SuspendedMods.length > 0;
  });
</script>

<template>
  <div v-if="!modIsSuspendedFromChannel">SuspendModButton</div>
  <div v-else>UnsuspendModButton</div>
</template>

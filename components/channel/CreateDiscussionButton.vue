<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRoute } from "vue-router";
import RequireAuth from "../auth/RequireAuth.vue";
import CreateButton from "../buttons/CreateButton.vue";
import PrimaryButton from "@/components/PrimaryButton.vue";

export default defineComponent({
  components: {
    CreateButton,
    PrimaryButton,
    RequireAuth,
  },
  setup() {
    const route = useRoute();

    const channelId = computed(() => {
      if (typeof route.params.channelId === "string") {
        return route.params.channelId;
      }
      return "";
    });
    
    return {
      channelId,
      route,
    };
  },
});
</script>

<template>
  <RequireAuth
    v-if="$route.name === 'DiscussionDetail'"
    class="flex inline-flex"
  >
    <template #has-auth>
      <CreateButton
        class="ml-2"
        :to="`/channels/c/${channelId}/discussions/create`"
        :label="'New Discussion'"
      />
    </template>
    <template #does-not-have-auth>
      <PrimaryButton
        class="ml-2"
        :label="'New Discussion'"
      />
    </template>
  </RequireAuth>
</template>

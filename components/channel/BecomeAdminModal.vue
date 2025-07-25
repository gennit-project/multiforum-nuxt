<script lang="ts" setup>
import { computed } from "vue";
import { useMutation } from "@vue/apollo-composable";
import GenericModal from "@/components/GenericModal.vue";
import { BECOME_CHANNEL_ADMIN } from "@/graphQLData/channel/mutations";
import { usernameVar } from "@/cache";

const props = defineProps({
  channelUniqueName: {
    type: String,
    required: true,
  },
  open: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "success"]);

const { mutate: becomeAdmin, loading, error, onDone } = useMutation(BECOME_CHANNEL_ADMIN);

onDone(() => {
  emit("success");
  emit("close");
});

function handleBecomeAdmin() {
  try {
    becomeAdmin({
      uniqueName: props.channelUniqueName,
      username: usernameVar.value,
    });
  } catch (err) {
    console.error("Error becoming admin:", err);
  }
}

const title = computed(() => "Become an admin of this forum?");
const body = computed(() => 
  "You will be able to add and remove mods, set rules for the forum and change the forum description and other settings."
);
</script>

<template>
  <GenericModal
    :highlight-color="'blue'"
    :title="title"
    :body="body"
    :open="open"
    :loading="loading"
    :primary-button-text="'Yes, make me an admin'"
    :secondary-button-text="'Cancel'"
    :error="error?.message || ''"
    @primary-button-click="handleBecomeAdmin"
    @secondary-button-click="$emit('close')"
  >
    <template #icon>
      <i class="fas fa-user-shield dark:text-white" />
    </template>
  </GenericModal>
</template>
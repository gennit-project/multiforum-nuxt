<script setup lang="ts">
<<<<<<< HEAD
  import { ref, computed, watch } from "vue";
  import { useRoute } from "nuxt/app";
  import { useMutation } from "@vue/apollo-composable";
  import { ENABLE_CHANNEL_WIKI, DISABLE_CHANNEL_WIKI } from "@/graphQLData/channel/mutations";
  import Notification from "@/components/NotificationComponent.vue";

  const props = defineProps({
    formValues: {
      type: Object,
      required: true,
    },
  });

  const route = useRoute();
  const channelId = route.params.forumId as string;
  const isWikiEnabled = ref(props.formValues.wikiEnabled);
  const showSavedNotification = ref(false);
  const mutationError = ref(null);

  // Enable wiki mutation
  const {
    mutate: enableWiki,
    loading: enableLoading,
    error: enableError,
    onDone: onEnableDone,
  } = useMutation(ENABLE_CHANNEL_WIKI);

  // Disable wiki mutation
  const {
    mutate: disableWiki,
    loading: disableLoading,
    error: disableError,
    onDone: onDisableDone,
  } = useMutation(DISABLE_CHANNEL_WIKI);

  const isLoading = computed(() => enableLoading.value || disableLoading.value);

  // Handle mutation completion
  onEnableDone(() => {
    showSavedNotification.value = true;
    // Also update parent form values to keep them in sync
    emitChange(true);
  });

  onDisableDone(() => {
    showSavedNotification.value = true;
    // Also update parent form values to keep them in sync
    emitChange(false);
  });

  // Watch for errors from either mutation
  watch([enableError, disableError], ([newEnableError, newDisableError]) => {
    if (newEnableError) {
      mutationError.value = newEnableError;
    } else if (newDisableError) {
      mutationError.value = newDisableError;
    } else {
      mutationError.value = null;
    }
  });

  // Toggle wiki setting
  function toggleWiki(event) {
    const isChecked = event.target && event.target.checked;

    if (isChecked) {
      enableWiki({ uniqueName: channelId });
    } else {
      disableWiki({ uniqueName: channelId });
    }

    isWikiEnabled.value = isChecked;
  }

  const emit = defineEmits(["updateFormValues"]);

  // Update the parent form values
  function emitChange(enabled) {
    emit("updateFormValues", {
      wikiEnabled: enabled,
    });
  }
=======
defineProps({
  formValues: {
    type: Object,
    required: true,
  },
});
defineEmits(["updateFormValues"]);
>>>>>>> parent of 666ae3d (Use automated formatting tools)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center">
      <input
        id="wiki-enabled"
<<<<<<< HEAD
        :checked="isWikiEnabled"
        :disabled="isLoading"
        class="h-4 w-4 rounded border border-gray-300 text-orange-600 focus:ring-orange-500 dark:border-gray-600"
        type="checkbox"
        @change="toggleWiki"
      >
      <label
        class="ml-2 block text-sm text-gray-900 dark:text-gray-100"
        for="wiki-enabled"
=======
        type="checkbox"
        :checked="formValues.wikiEnabled"
        class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
        @change="$emit('updateFormValues', { wikiEnabled: ($event.target as HTMLInputElement).checked })"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
      >
      <label for="wiki-enabled" class="ml-2 block text-sm text-gray-900 dark:text-gray-100">
        Enable wiki for this forum
      </label>
      <span
        v-if="isLoading"
        class="ml-2 text-sm text-gray-500"
        >Saving...</span
      >
    </div>

    <div
      v-if="mutationError"
      class="mt-2 text-sm text-red-600 dark:text-red-400"
    >
      {{ mutationError.message }}
    </div>

    <!-- Notification when saved successfully -->
    <Notification
      v-if="showSavedNotification"
      title="Wiki settings updated successfully"
      @close-notification="showSavedNotification = false"
    />
  </div>
</template>

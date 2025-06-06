<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { GET_USER } from "@/graphQLData/user/queries";
import { UPDATE_USER } from "@/graphQLData/user/mutations";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import NotificationComponent from "@/components/NotificationComponent.vue";
import TabButton from "@/components/channel/TabButton.vue";
import CogIcon from "@/components/icons/CogIcon.vue";
import MessageIcon from "@/components/icons/MessageIcon.vue";
import FormRow from "@/components/FormRow.vue";
import CheckBox from "@/components/CheckBox.vue";
import SelectComponent from "@/components/SelectComponent.vue";
import SaveButton from "@/components/SaveButton.vue";
import type { UserUpdateInput } from "@/__generated__/graphql";
import { usernameVar } from "@/cache";
import { useRoute } from "nuxt/app";

type NotificationFormValues = {
  notifyOnReplyToCommentByDefault: boolean;
  notifyOnReplyToDiscussionByDefault: boolean;
  notifyOnReplyToEventByDefault: boolean;
  notifyWhenTagged: boolean;
  notifyOnFeedback: boolean;
  notificationBundleInterval: string;
  notificationBundleEnabled: boolean;
};

const route = useRoute();

const usernameInParams = computed(() => {
  return typeof route.params.username === "string" ? route.params.username : "";
});

const {
  result: getUserResult,
  loading: getUserLoading,
  error: getUserError,
  refetch: refetchUser,
} = useQuery(GET_USER, {
  username: usernameInParams,
}, {
  enabled: !!usernameInParams.value,
});

const getDefaultNotificationValues = (): NotificationFormValues => ({
  notifyOnReplyToCommentByDefault: false,
  notifyOnReplyToDiscussionByDefault: false,
  notifyOnReplyToEventByDefault: false,
  notifyWhenTagged: false,
  notifyOnFeedback: false,
  notificationBundleInterval: "hourly",
  notificationBundleEnabled: true,
});

const formValues = ref<NotificationFormValues>(getDefaultNotificationValues());
const dataLoaded = ref(false);
const showSavedChangesNotification = ref(false);

watch(
  getUserResult,
  (newVal) => {
    if (newVal && newVal.users.length > 0) {
      const user = newVal.users[0];
      // Update properties in place to avoid triggering the watcher recursively
      formValues.value.notifyOnReplyToCommentByDefault = user.notifyOnReplyToCommentByDefault ?? false;
      formValues.value.notifyOnReplyToDiscussionByDefault = user.notifyOnReplyToDiscussionByDefault ?? false;
      formValues.value.notifyOnReplyToEventByDefault = user.notifyOnReplyToEventByDefault ?? false;
      formValues.value.notifyWhenTagged = user.notifyWhenTagged ?? false;
      formValues.value.notifyOnFeedback = user.notifyOnFeedback ?? false;
      formValues.value.notificationBundleInterval = user.notificationBundleInterval ?? "hourly";
      formValues.value.notificationBundleEnabled = user.notificationBundleEnabled ?? true;
      dataLoaded.value = true;
    }
  }
);

// Handle initial data load
if (getUserResult.value && getUserResult.value.users.length > 0) {
  const user = getUserResult.value.users[0];
  formValues.value.notifyOnReplyToCommentByDefault = user.notifyOnReplyToCommentByDefault ?? false;
  formValues.value.notifyOnReplyToDiscussionByDefault = user.notifyOnReplyToDiscussionByDefault ?? false;
  formValues.value.notifyOnReplyToEventByDefault = user.notifyOnReplyToEventByDefault ?? false;
  formValues.value.notifyWhenTagged = user.notifyWhenTagged ?? false;
  formValues.value.notifyOnFeedback = user.notifyOnFeedback ?? false;
  formValues.value.notificationBundleInterval = user.notificationBundleInterval ?? "hourly";
  formValues.value.notificationBundleEnabled = user.notificationBundleEnabled ?? true;
  dataLoaded.value = true;
}

const userUpdateInput = computed(() => {
  return {
    notifyOnReplyToCommentByDefault: formValues.value.notifyOnReplyToCommentByDefault,
    notifyOnReplyToDiscussionByDefault: formValues.value.notifyOnReplyToDiscussionByDefault,
    notifyOnReplyToEventByDefault: formValues.value.notifyOnReplyToEventByDefault,
    notifyWhenTagged: formValues.value.notifyWhenTagged,
    notifyOnFeedback: formValues.value.notifyOnFeedback,
    notificationBundleInterval: formValues.value.notificationBundleInterval,
    notificationBundleEnabled: formValues.value.notificationBundleEnabled,
  } as UserUpdateInput;
});

const {
  mutate: updateUser,
  loading: updateUserLoading,
  error: updateUserError,
  onDone,
} = useMutation(UPDATE_USER);

onDone(() => {
  showSavedChangesNotification.value = true;
});

async function submit() {
  await updateUser({
    where: { username: usernameVar.value },
    update: userUpdateInput.value,
  });
  await refetchUser({
    // @ts-ignore
    username: usernameVar.value,
  });
}

const bundleIntervalOptions = [
  { value: "immediate", label: "Send immediately" },
  { value: "hourly", label: "Once per hour" },
  { value: "daily", label: "Once per day" },
  { value: "weekly", label: "Once per week" },
];


const tabs = computed(() => [
  {
    name: "basic",
    href: `/u/${usernameInParams.value}/settings`,
    label: "Basic Settings",
    icon: CogIcon,
  },
  {
    name: "notifications",
    href: `/u/${usernameInParams.value}/settings/notifications`,
    label: "Notifications",
    icon: MessageIcon,
  },
]);
</script>

<template>
  <RequireAuth
    :require-ownership="true"
    :owners="[usernameInParams]"
    :loading="getUserLoading"
    :full-width="true"
  >
    <template #has-auth>
      <div class="bg-white dark:bg-gray-900 dark:text-white w-full px-6 lg:px-12">
        <!-- Tab Navigation -->
        <nav class="flex space-x-2 pt-1 text-sm border-b border-gray-200 dark:border-gray-700 mb-6" aria-label="Settings Tabs">
          <TabButton
            v-for="tab in tabs"
            :key="tab.name"
            :to="tab.href"
            :label="tab.label"
          >
            <component :is="tab.icon" class="h-5 w-5 shrink-0" />
          </TabButton>
        </nav>

        <!-- Notification Settings Form -->
        <div v-if="dataLoaded" class="space-y-6">
          <h2 class="text-xl font-semibold mb-4">Notification Settings</h2>
          
          <!-- Email Notification Preferences -->
          <FormRow section-title="Email Notifications">
            <template #content>
              <div class="space-y-4">
                <div class="flex items-center">
                  <CheckBox
                    :test-id="'notify-comment-reply'"
                    :checked="formValues.notifyOnReplyToCommentByDefault"
                    @update="formValues.notifyOnReplyToCommentByDefault = $event"
                  />
                  <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Notify me when someone replies to my comments
                  </label>
                </div>
                
                <div class="flex items-center">
                  <CheckBox
                    :test-id="'notify-discussion-reply'"
                    :checked="formValues.notifyOnReplyToDiscussionByDefault"
                    @update="formValues.notifyOnReplyToDiscussionByDefault = $event"
                  />
                  <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Notify me when someone replies to my discussions
                  </label>
                </div>
                
                <div class="flex items-center">
                  <CheckBox
                    :test-id="'notify-event-reply'"
                    :checked="formValues.notifyOnReplyToEventByDefault"
                    @update="formValues.notifyOnReplyToEventByDefault = $event"
                  />
                  <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Notify me when someone replies to my events
                  </label>
                </div>
                
                <div class="flex items-center">
                  <CheckBox
                    :test-id="'notify-tagged'"
                    :checked="formValues.notifyWhenTagged"
                    @update="formValues.notifyWhenTagged = $event"
                  />
                  <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Notify me when someone tags me in a comment
                  </label>
                </div>
                
                <div class="flex items-center">
                  <CheckBox
                    :test-id="'notify-feedback'"
                    :checked="formValues.notifyOnFeedback"
                    @update="formValues.notifyOnFeedback = $event"
                  />
                  <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Notify me when I receive feedback from moderators
                  </label>
                </div>
              </div>
            </template>
          </FormRow>

          <!-- Save Button -->
          <div class="pt-4">
            <SaveButton
              :test-id="'save-notification-settings'"
              :loading="updateUserLoading"
              @click="submit"
            />
          </div>

          <!-- Error Display -->
          <div v-if="getUserError || updateUserError" class="text-red-600 dark:text-red-400 text-sm">
            {{ getUserError?.message || updateUserError?.message }}
          </div>
        </div>

        <!-- Loading State -->
        <div v-else-if="getUserLoading" class="text-center py-8">
          <div class="text-gray-500 dark:text-gray-400">Loading notification settings...</div>
        </div>
        
        <NotificationComponent
          v-if="showSavedChangesNotification"
          title="Your notification settings have been saved."
          @close-notification="showSavedChangesNotification = false"
        />
      </div>
    </template>
    <template #does-not-have-auth>
      <p class="dark:text-white mt-6">You don't have permission to see this page.</p>
    </template>
  </RequireAuth>
</template>
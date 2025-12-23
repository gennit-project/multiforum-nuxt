<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { GET_USER } from '@/graphQLData/user/queries';
import { UPDATE_USER } from '@/graphQLData/user/mutations';
import EditAccountSettingsFields from '@/components/user/EditAccountSettingsFields.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import NotificationComponent from '@/components/NotificationComponent.vue';
import FormRow from '@/components/FormRow.vue';
import CheckBox from '@/components/CheckBox.vue';
import type { EditAccountSettingsFormValues } from '@/types/User';
import type { UserUpdateInput } from '@/__generated__/graphql';
import { usernameVar } from '@/cache';
type NotificationFormValues = {
  notifyOnReplyToCommentByDefault: boolean;
  notifyOnReplyToDiscussionByDefault: boolean;
  notifyOnReplyToEventByDefault: boolean;
  notifyWhenTagged: boolean;
  notifyOnFeedback: boolean;
  notificationBundleInterval: string;
  notificationBundleEnabled: boolean;
  enableSensitiveContentByDefault: boolean;
};

const {
  result: getUserResult,
  loading: getUserLoading,
  error: getUserError,
  refetch: refetchUser,
} = useQuery(
  GET_USER,
  {
    username: usernameVar,
  },
  {
    enabled: !!usernameVar.value,
  }
);

// Basic settings form values
const getDefaultUserValues = (): EditAccountSettingsFormValues => ({
  profilePicURL: '',
  displayName: '',
  bio: '',
});

const basicFormValues = ref<EditAccountSettingsFormValues>(
  getDefaultUserValues()
);

// Notification settings form values
const getDefaultNotificationValues = (): NotificationFormValues => ({
  notifyOnReplyToCommentByDefault: false,
  notifyOnReplyToDiscussionByDefault: false,
  notifyOnReplyToEventByDefault: false,
  notifyWhenTagged: false,
  notifyOnFeedback: false,
  notificationBundleInterval: 'hourly',
  notificationBundleEnabled: true,
  enableSensitiveContentByDefault: false,
});

const notificationFormValues = ref<NotificationFormValues>(
  getDefaultNotificationValues()
);

const dataLoaded = ref(false);
const showSavedChangesNotification = ref(false);

const userEmail = computed(() => {
  if (getUserResult.value && getUserResult.value.users.length > 0) {
    return getUserResult.value.users[0].Email?.address || null;
  }
  return null;
});

watch(getUserResult, (newVal) => {
  if (newVal && newVal.users.length > 0) {
    const user = newVal.users[0];

    // Update basic settings
    basicFormValues.value = {
      profilePicURL: user.profilePicURL || '',
      displayName: user.displayName || '',
      bio: user.bio || '',
    };

    // Update notification settings
    notificationFormValues.value.notifyOnReplyToCommentByDefault =
      user.notifyOnReplyToCommentByDefault ?? false;
    notificationFormValues.value.notifyOnReplyToDiscussionByDefault =
      user.notifyOnReplyToDiscussionByDefault ?? false;
    notificationFormValues.value.notifyOnReplyToEventByDefault =
      user.notifyOnReplyToEventByDefault ?? false;
    notificationFormValues.value.notifyWhenTagged =
      user.notifyWhenTagged ?? false;
    notificationFormValues.value.notifyOnFeedback =
      user.notifyOnFeedback ?? false;
    notificationFormValues.value.notificationBundleInterval =
      user.notificationBundleInterval ?? 'hourly';
    notificationFormValues.value.notificationBundleEnabled =
      user.notificationBundleEnabled ?? true;
    notificationFormValues.value.enableSensitiveContentByDefault =
      user.enableSensitiveContentByDefault ?? false;

    dataLoaded.value = true;
  }
});

// Handle initial data load
if (getUserResult.value && getUserResult.value.users.length > 0) {
  const user = getUserResult.value.users[0];

  basicFormValues.value = {
    profilePicURL: user.profilePicURL || '',
    displayName: user.displayName || '',
    bio: user.bio || '',
  };

  notificationFormValues.value.notifyOnReplyToCommentByDefault =
    user.notifyOnReplyToCommentByDefault ?? false;
  notificationFormValues.value.notifyOnReplyToDiscussionByDefault =
    user.notifyOnReplyToDiscussionByDefault ?? false;
  notificationFormValues.value.notifyOnReplyToEventByDefault =
    user.notifyOnReplyToEventByDefault ?? false;
  notificationFormValues.value.notifyWhenTagged =
    user.notifyWhenTagged ?? false;
  notificationFormValues.value.notifyOnFeedback =
    user.notifyOnFeedback ?? false;
  notificationFormValues.value.notificationBundleInterval =
    user.notificationBundleInterval ?? 'hourly';
  notificationFormValues.value.notificationBundleEnabled =
    user.notificationBundleEnabled ?? true;
  notificationFormValues.value.enableSensitiveContentByDefault =
    user.enableSensitiveContentByDefault ?? false;

  dataLoaded.value = true;
}

const basicUserUpdateInput = computed(() => {
  return {
    displayName: basicFormValues.value.displayName,
    bio: basicFormValues.value.bio,
    profilePicURL: basicFormValues.value.profilePicURL,
  } as UserUpdateInput;
});

const notificationUserUpdateInput = computed(() => {
  return {
    notifyOnReplyToCommentByDefault:
      notificationFormValues.value.notifyOnReplyToCommentByDefault,
    notifyOnReplyToDiscussionByDefault:
      notificationFormValues.value.notifyOnReplyToDiscussionByDefault,
    notifyOnReplyToEventByDefault:
      notificationFormValues.value.notifyOnReplyToEventByDefault,
    notifyWhenTagged: notificationFormValues.value.notifyWhenTagged,
    notifyOnFeedback: notificationFormValues.value.notifyOnFeedback,
    notificationBundleInterval:
      notificationFormValues.value.notificationBundleInterval,
    notificationBundleEnabled:
      notificationFormValues.value.notificationBundleEnabled,
    enableSensitiveContentByDefault:
      notificationFormValues.value.enableSensitiveContentByDefault,
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

async function submitBasicSettings() {
  await updateUser({
    where: { username: usernameVar.value },
    update: basicUserUpdateInput.value,
  });
  await refetchUser({
    // @ts-ignore
    username: usernameVar.value,
  });
}

async function submitNotificationSettings() {
  await updateUser({
    where: { username: usernameVar.value },
    update: notificationUserUpdateInput.value,
  });
  await refetchUser({
    // @ts-ignore
    username: usernameVar.value,
  });
}

function updateBasicFormValues(data: Partial<EditAccountSettingsFormValues>) {
  basicFormValues.value = { ...basicFormValues.value, ...data };
}

// Debounced auto-save for notification settings
let saveTimeout: NodeJS.Timeout;
function debouncedAutoSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(async () => {
    if (dataLoaded.value) {
      await submitNotificationSettings();
    }
  }, 800); // 800ms delay
}

// Handle checkbox updates with auto-save
function handleCheckboxUpdate(
  field: keyof NotificationFormValues,
  value: boolean | string
) {
  (notificationFormValues.value as any)[field] = value;
  debouncedAutoSave();
}
</script>

<template>
  <NuxtLayout name="default">
    <RequireAuth
      :require-ownership="false"
      :loading="getUserLoading"
      :full-width="true"
    >
      <template #has-auth>
        <div class="min-h-screen bg-white dark:bg-gray-900 dark:text-white">
          <div class="mx-auto max-w-4xl px-6 py-8 lg:px-12">
            <!-- Basic Settings Section -->
            <div class="mb-12">
              <EditAccountSettingsFields
                :key="dataLoaded.toString()"
                :edit-mode="true"
                :user-loading="getUserLoading"
                :get-user-error="getUserError"
                :update-user-error="updateUserError"
                :update-user-loading="updateUserLoading"
                :form-values="basicFormValues"
                @submit="submitBasicSettings"
                @update-form-values="updateBasicFormValues"
              />
            </div>

            <div v-if="dataLoaded" class="space-y-6">
              <h2 class="font-semibold mb-4 text-xl">Account</h2>

              <!-- Email Address -->
              <FormRow section-title="Email Address">
                <template #content>
                  <div class="text-sm text-gray-700 dark:text-gray-300">
                    <span v-if="userEmail">{{ userEmail }}</span>
                    <span v-else class="text-gray-500 dark:text-gray-400 italic"
                      >No email address associated</span
                    >
                  </div>
                </template>
              </FormRow>

              <h2 class="font-semibold mb-4 text-xl pt-6">Preferences</h2>

              <!-- Email Notification Preferences -->
              <FormRow section-title="Email Notifications">
                <template #content>
                  <div class="space-y-4">
                    <div class="flex items-center">
                      <CheckBox
                        :test-id="'notify-comment-reply'"
                        :checked="
                          notificationFormValues.notifyOnReplyToCommentByDefault
                        "
                        @update="
                          handleCheckboxUpdate(
                            'notifyOnReplyToCommentByDefault',
                            $event
                          )
                        "
                      />
                      <label
                        class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        Email me when someone replies to my comments
                      </label>
                    </div>

                    <div class="flex items-center">
                      <CheckBox
                        :test-id="'notify-discussion-reply'"
                        :checked="
                          notificationFormValues.notifyOnReplyToDiscussionByDefault
                        "
                        @update="
                          handleCheckboxUpdate(
                            'notifyOnReplyToDiscussionByDefault',
                            $event
                          )
                        "
                      />
                      <label
                        class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        Email me when someone replies to my discussions
                      </label>
                    </div>

                    <div class="flex items-center">
                      <CheckBox
                        :test-id="'notify-event-reply'"
                        :checked="
                          notificationFormValues.notifyOnReplyToEventByDefault
                        "
                        @update="
                          handleCheckboxUpdate(
                            'notifyOnReplyToEventByDefault',
                            $event
                          )
                        "
                      />
                      <label
                        class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        Email me when someone replies to my events
                      </label>
                    </div>

                    <div class="flex items-center">
                      <CheckBox
                        :test-id="'notify-tagged'"
                        :checked="notificationFormValues.notifyWhenTagged"
                        @update="
                          handleCheckboxUpdate('notifyWhenTagged', $event)
                        "
                      />
                      <label
                        class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        Email me when someone tags me in a comment
                      </label>
                    </div>

                    <div class="flex items-center">
                      <CheckBox
                        :test-id="'notify-feedback'"
                        :checked="notificationFormValues.notifyOnFeedback"
                        @update="
                          handleCheckboxUpdate('notifyOnFeedback', $event)
                        "
                      />
                      <label
                        class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        Email me when I receive feedback from moderators
                      </label>
                    </div>
                  </div>
                </template>
              </FormRow>

              <!-- Content Preferences -->
              <FormRow section-title="Content Preferences">
                <template #content>
                  <div class="space-y-4">
                    <div class="flex items-center">
                      <CheckBox
                        :test-id="'enable-sensitive-content'"
                        :checked="
                          notificationFormValues.enableSensitiveContentByDefault
                        "
                        @update="
                          handleCheckboxUpdate(
                            'enableSensitiveContentByDefault',
                            $event
                          )
                        "
                      />
                      <label
                        class="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        I am over 18 and want to view sensitive content by
                        default
                      </label>
                    </div>
                  </div>
                </template>
              </FormRow>

              <!-- Error Display -->
              <div
                v-if="getUserError || updateUserError"
                class="text-sm text-red-600 dark:text-red-400"
              >
                {{ getUserError?.message || updateUserError?.message }}
              </div>
            </div>

            <!-- Loading State for Notifications -->
            <div v-else-if="getUserLoading" class="py-8 text-center">
              <div class="text-gray-500 dark:text-gray-400">
                Loading notification settings...
              </div>
            </div>

            <NotificationComponent
              v-if="showSavedChangesNotification"
              title="Your settings have been saved."
              @close-notification="showSavedChangesNotification = false"
            />
          </div>
        </div>
      </template>
      <template #does-not-have-auth>
        <div class="mx-auto max-w-4xl px-6 py-8 lg:px-12">
          <p class="mt-6 dark:text-white">
            You must be logged in to access account settings.
          </p>
        </div>
      </template>
    </RequireAuth>
  </NuxtLayout>
</template>

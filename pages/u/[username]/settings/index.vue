<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { GET_USER } from "@/graphQLData/user/queries";
import { UPDATE_USER } from "@/graphQLData/user/mutations";
import EditAccountSettingsFields from "@/components/user/EditAccountSettingsFields.vue";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import NotificationComponent from "@/components/NotificationComponent.vue";
import TabButton from "@/components/channel/TabButton.vue";
import CogIcon from "@/components/icons/CogIcon.vue";
import MessageIcon from "@/components/icons/MessageIcon.vue";
import type { EditAccountSettingsFormValues } from "@/types/User";
import type { UserUpdateInput } from "@/__generated__/graphql";
import { usernameVar } from "@/cache";
import { useRoute } from "nuxt/app";

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
},
{
  enabled: !!usernameInParams.value,
});

const getDefaultUserValues = () => ({
  profilePicURL: "",
  displayName: "",
  bio: "",
});

const formValues = ref<EditAccountSettingsFormValues>(getDefaultUserValues());

const dataLoaded = ref(false);
const showSavedChangesNotification = ref(false);

watch(
  getUserResult,
  (newVal) => {
    if (newVal && newVal.users.length > 0) {
      const user = newVal.users[0];
      formValues.value = {
        profilePicURL: user.profilePicURL || "",
        displayName: user.displayName || "",
        bio: user.bio || "",
      };
      dataLoaded.value = true;
    }
  }
);

// Handle initial data load
if (getUserResult.value && getUserResult.value.users.length > 0) {
  const user = getUserResult.value.users[0];
  formValues.value = {
    profilePicURL: user.profilePicURL || "",
    displayName: user.displayName || "",
    bio: user.bio || "",
  };
  dataLoaded.value = true;
}

const userUpdateInput = computed(() => {
  return {
    displayName: formValues.value.displayName,
    bio: formValues.value.bio,
    profilePicURL: formValues.value.profilePicURL,
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

function updateFormValues(data: EditAccountSettingsFormValues) {
  formValues.value = { ...formValues.value, ...data };
}

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

        <!-- Current Settings Form -->
        <EditAccountSettingsFields
          :key="dataLoaded.toString()"
          :edit-mode="true"
          :user-loading="getUserLoading"
          :get-user-error="getUserError"
          :update-user-error="updateUserError"
          :update-user-loading="updateUserLoading"
          :form-values="formValues"
          @submit="submit"
          @update-form-values="updateFormValues"
        />
        
        <NotificationComponent
          v-if="showSavedChangesNotification"
          title="Your changes have been saved."
          @close-notification="showSavedChangesNotification = false"
        />
      </div>
    </template>
    <template #does-not-have-auth>
      <p class="dark:text-white mt-6">You don't have permission to see this page.</p>
    </template>
  </RequireAuth>
</template>
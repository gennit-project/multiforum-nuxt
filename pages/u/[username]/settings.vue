<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  useQuery,
  useMutation,
  provideApolloClient,
} from "@vue/apollo-composable";
import { GET_USER , GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import { UPDATE_USER } from "@/graphQLData/user/mutations";
import EditAccountSettingsFields from "@/components/user/EditAccountSettingsFields.vue";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import type { UserUpdateInput } from "@/__generated__/graphql";
import type { EditAccountSettingsFormValues } from "@/types/User";
import NotificationComponent from "@/components/NotificationComponent.vue";

export default defineComponent({
  name: "EditAccountSettings",
  components: {
    EditAccountSettingsFields,
    NotificationComponent,
    RequireAuth,
  },
  apollo: {},
  setup() {
    provideApolloClient(apolloClient);
    const route = useRoute();
    const router = useRouter();

    const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

    const username = computed(() => {
      const username = localUsernameResult.value?.username;
      if (username) {
        return username;
      }
      return "";
    });

    const usernameInParams = computed(() => {
      if (typeof route.params.username === "string") {
        return route.params.username;
      }
      return "";
    });

    const {
      error: getUserError,
      result: getUserResult,
      onResult: onGetUserResult,
      loading: getUserLoading,
      refetch: refetchUser,
    } = useQuery(GET_USER, {
      username: usernameInParams,
    });

    const user = computed(() => {
      if (getUserLoading.value || getUserError.value) {
        return null;
      }
      return getUserResult.value.users[0];
    });

    const getDefaultUserValues = () => {
      if (user.value) {
        return {
          profilePicURL: user.value.profilePicURL,
          displayName: user.value.displayName,
          bio: user.value.bio,
        };
      }

      return {
        profilePicURL: "",
        displayName: "",
        bio: "",
      };
    };

    const formValues = ref<EditAccountSettingsFormValues>(
      getDefaultUserValues(),
    );

    const dataLoaded = ref(false);
    const showSavedChangesNotification = ref(false);

    onGetUserResult((value) => {
      if (value.loading) {
        return;
      }

      const user = value.data.users[0];

      formValues.value = {
        profilePicURL: user.profilePicURL,
        displayName: user.displayName,
        bio: user.bio,
      };

      dataLoaded.value = true;
    });

    const userUpdateInput = computed(() => {
      const result: UserUpdateInput = {
        displayName: formValues.value.displayName,
        bio: formValues.value.bio,
        profilePicURL: formValues.value.profilePicURL,
      };
      return result;
    });

    const {
      mutate: updateUser,
      error: updateUserError,
      onDone,
    } = useMutation(UPDATE_USER);

    onDone(() => {
      showSavedChangesNotification.value = true;
    });

    return {
      user,
      username,
      usernameInParams,
      userUpdateInput,
      formValues,
      dataLoaded,
      getUserError,
      getUserLoading,
      getUserResult,
      refetchUser,
      router,
      showSavedChangesNotification,
      updateUserError,
      updateUser,
    };
  },
  methods: {
    async submit() {
      await this.updateUser({
        where: {
          username: this.username,
        },
        update: this.userUpdateInput,
      });
      // Normally I would say that username is a key field in the cache
      // settings for the User type. This would make it so that when the resource
      // is updated, the cache is updated as well. However, there was a bug in
      // the account creation process related to the username field being a key,
      // so I removed it, and manually do this refetch instead. The ideal solution
      // would be to fix the account creation flow without having to remove the
      // key field configuration from the User type, but I haven't figured that out.
      // If the account creation process is fixed, this manual refetch can be removed.
      this.refetchUser({
        username: this.username,
      });
    },
    updateFormValues(data: EditAccountSettingsFormValues) {
      // Update all form values at once because it makes cleaner
      // code than passing each form individual value as a prop
      // or writing separate methods to update each value.
      const existingValues = this.formValues;
      this.formValues = {
        ...existingValues,
        ...data,
      };
    },
  },
});
</script>
<template>
  <RequireAuth
    :require-ownership="true"
    :owners="[usernameInParams]"
  >
    <template #has-auth>
      <EditAccountSettingsFields
        :key="dataLoaded.toString()"
        :edit-mode="true"
        :user-loading="getUserLoading"
        :get-user-error="getUserError"
        :update-user-error="updateUserError"
        :form-values="formValues"
        @submit="submit"
        @update-form-values="updateFormValues"
      />
      <NotificationComponent
        v-if="showSavedChangesNotification"
        :title="'Your changes have been saved.'"
        @close-notification="showSavedChangesNotification = false"
      />
    </template>
    <template #does-not-have-auth>
      <div>You don't have permission to see this page.</div>
    </template>
  </RequireAuth>
</template>

<style></style>

<script lang="ts">
import { defineComponent, ref, nextTick, computed } from "vue";
import CheckCircleIcon from "../icons/CheckCircleIcon.vue";
import { DOES_USER_EXIST } from "@/graphQLData/user/queries";
import { CREATE_EMAIL_AND_USER } from "@/graphQLData/email/mutations";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { useAuth0 } from "@auth0/auth0-vue";
import ExclamationIcon from "../icons/ExclamationIcon.vue";
import PrimaryButton from "../buttons/PrimaryButton.vue";
import ErrorBanner from "../ErrorBanner.vue";
import { usernameVar, modProfileNameVar } from "@/cache";

export default defineComponent({
  components: {
    CheckCircleIcon,
    ErrorBanner,
    ExclamationIcon,
    PrimaryButton,
  },
  props: {
    email: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const { isAuthenticated, user } = useAuth0();
    const newUsername = ref(props.email?.split("@")[0]);

    const {
      error: getUserError,
      result: getUserResult,
      loading: getUserLoading,
    } = useQuery(DOES_USER_EXIST, {
      username: newUsername,
    });
    const {
      mutate: createEmailAndUser,
      error: createEmailAndUserError,
      loading: createEmailAndUserLoading,
      onDone: onEmailAndUserCreated,
    } = useMutation(CREATE_EMAIL_AND_USER, () => ({
      variables: {
        emailAddress: user.value.email,
        username: newUsername.value,
      },
    }));

    const usernameIsTaken = computed(() => {
      if (getUserError.value || getUserLoading.value) {
        return false;
      }
      if (
        getUserResult &&
        getUserResult.value?.users &&
        getUserResult.value.users.length > 0
      ) {
        return true;
      }
      return false;
    });

    const usernameIsEmpty = computed(() => {
      return newUsername.value.length === 0;
    });

    const isValidUsername = (username: string) => {
      const validUsernamePattern = /^[a-zA-Z0-9_]+$/;
      return validUsernamePattern.test(username);
    };

    const usernameIsInvalid = computed(() => {
      return !isValidUsername(newUsername.value);
    });

    const confirmedAvailable = computed(() => {
      return !usernameIsTaken.value && !usernameIsEmpty.value && !usernameIsInvalid.value;
    });

    onEmailAndUserCreated((result) => {
      const user = result.data.createEmailAndUser;

      if (user) {
        const username = user?.username;
        if (!username) {
          console.error("No username returned from createEmailAndUser");
          return;
        }
        const modProfileName = user.ModerationProfile?.displayName;
        if (!modProfileName) {
          console.error("No mod profile returned from createEmailAndUser");
          return;
        }

        if (username) {
          usernameVar(username);
        }

        if (modProfileName) {
          modProfileNameVar(modProfileName);
        }

        emit("emailAndUserCreated")
      }
    });

    return {
      confirmedAvailable,
      createEmailAndUser,
      createEmailAndUserError,
      createEmailAndUserLoading,
      isAuthenticated,
      newUsername,
      user,
      usernameInput: ref(null),
      usernameIsEmpty,
      usernameIsTaken,
      usernameIsInvalid,
    };
  },
  created() {
    nextTick(() => {
      this.usernameInput.focus();
    });
  },
  methods: {
    updateUsername(newUsername: string) {
      this.touched = true;
      this.$emit("updateUsername", newUsername);
    },
  },
});
</script>
<template>
  <div>
    <div class="my-4 h-72 px-10 py-6">
      <h1 class="my-8 flex justify-center text-xl">
        Create Username
      </h1>
      <label
        for="username"
        class="block text-sm font-medium text-gray-700"
      >Username</label>
      <div class="relative mt-1 flex rounded-full shadow-sm">
        <input
          ref="usernameInput"
          v-model="newUsername"
          type="text"
          :class="[
            usernameIsTaken || usernameIsInvalid
              ? 'border-red-300 text-red-500 focus:border-red-500 focus:outline-none focus:ring-red-500'
              : 'focus:border-blue-500 focus:ring-blue-500',
          ]"
          class="block w-full flex-1 rounded border-gray-300 pb-2.5 pt-2.5 dark:bg-gray-800 sm:text-sm"
          @update:model-value="updateUsername"
        >
        <div
          v-if="usernameIsTaken || usernameIsInvalid"
          class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
        >
          <ExclamationIcon
            class="h-5 w-5 text-red-500"
            aria-hidden="true"
          />
        </div>
      </div>

      <div class="h-6">
        <p class="my-1 text-xs">
          {{ usernameIsTaken ? "The username is already taken." : "" }}
          {{ usernameIsInvalid ? "Username can only contain letters, numbers, and underscores." : "" }}
        </p>
        <div
          v-if="confirmedAvailable"
          class="flex items-start"
        >
          <div class="flex-shrink-0">
            <CheckCircleIcon
              class="mr-2 h-6 w-6 text-green-400"
              aria-hidden="true"
            />
          </div>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-200">
            This username is available
          </p>
        </div>
      </div>

      <PrimaryButton
        class="float-right my-4"
        :label="'Save'"
        :disabled="!confirmedAvailable"
        :loading="createEmailAndUserLoading"
        @click="createEmailAndUser"
      />
      <p v-if="createEmailAndUserLoading">
        Loading...
      </p>
    </div>
    <ErrorBanner
      v-if="createEmailAndUserError"
      class="mx-auto my-3 max-w-5xl"
      :text="createEmailAndUserError.message"
    />
  </div>
</template>

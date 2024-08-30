<script setup lang="ts">
import { ref, nextTick, computed } from "vue";
import CheckCircleIcon from "~/components/icons/CheckCircleIcon.vue";
import ExclamationIcon from "~/components/icons/ExclamationIcon.vue";
import PrimaryButton from "~/components/buttons/PrimaryButton.vue";
import ErrorBanner from "~/components/ErrorBanner.vue";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { DOES_USER_EXIST } from "@/graphQLData/user/queries";
import { CREATE_EMAIL_AND_USER } from "@/graphQLData/email/mutations";
import { useAuth } from "#auth"; // For Nuxt's Auth integration
import { usernameVar, modProfileNameVar } from "@/cache"; // Ensure these are properly imported from your state management

const props = defineProps({
  email: {
    type: String,
    required: true,
  },
});

const { isAuthenticated, user } = useAuth();
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
  if (getUserResult && getUserResult.value?.users?.length > 0) {
    return true;
  }
  return false;
});

const usernameIsEmpty = computed(() => newUsername.value.length === 0);

const isValidUsername = (username: string) => /^[a-zA-Z0-9_]+$/.test(username);

const usernameIsInvalid = computed(() => !isValidUsername(newUsername.value));

const confirmedAvailable = computed(
  () => !usernameIsTaken.value && !usernameIsEmpty.value && !usernameIsInvalid.value
);

const emit = defineEmits(["emailAndUserCreated", "updateUsername"]);

onEmailAndUserCreated((result) => {
  const user = result.data.createEmailAndUser;

  if (user) {
    const username = user?.username;
    const modProfileName = user?.ModerationProfile?.displayName;

    if (username) {
      usernameVar(username);
    }

    if (modProfileName) {
      modProfileNameVar(modProfileName);
    }

    emit("emailAndUserCreated");
  }
});

const updateUsername = (newUsernameString: string) => {
  newUsername.value = newUsernameString;
  emit("updateUsername", newUsernameString);
};

const usernameInput = ref<HTMLInputElement | null>(null);

nextTick(() => {
  usernameInput.value?.focus();
});


</script>

<template>
  <div>
    <div class="my-4 h-72 px-10 py-6">
      <h1 class="my-8 flex justify-center text-xl">
        Create Username
      </h1>
      <label for="username" class="block text-sm font-medium text-gray-700">
        Username
      </label>
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
        <div v-if="usernameIsTaken || usernameIsInvalid" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ExclamationIcon class="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>
      </div>

      <div class="h-6">
        <p class="my-1 text-xs">
          {{ usernameIsTaken ? "The username is already taken." : "" }}
          {{ usernameIsInvalid ? "Username can only contain letters, numbers, and underscores." : "" }}
        </p>
        <div v-if="confirmedAvailable" class="flex items-start">
          <div class="flex-shrink-0">
            <CheckCircleIcon class="mr-2 h-6 w-6 text-green-400" aria-hidden="true" />
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
    <ErrorBanner v-if="createEmailAndUserError" class="mx-auto my-3 max-w-5xl" :text="createEmailAndUserError.message" />
  </div>
</template>

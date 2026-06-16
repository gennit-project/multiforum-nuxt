<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import CheckCircleIcon from '@/components/icons/CheckCircleIcon.vue';
import ExclamationIcon from '@/components/icons/ExclamationIcon.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import DatePicker from '@/components/event/form/DatePicker.vue';
import CharCounter from '@/components/CharCounter.vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { DOES_USER_EXIST } from '@/graphQLData/user/queries';
import { CREATE_EMAIL_AND_USER } from '@/graphQLData/email/mutations';
import {
  setUsername,
  setModProfileName,
  setIsAuthenticated,
  setIsLoadingAuth,
} from '@/cache';
import { MAX_CHARS_IN_USERNAME } from '@/utils/constants';
import {
  isValidUsername,
  getUsernameValidationMessage,
  calculateAge,
  getBirthdayValidationMessage,
  MIN_SIGNUP_AGE,
} from '@/utils/usernameValidation';

const props = defineProps({
  email: {
    type: String,
    required: true,
  },
});
const newUsername = ref(props.email?.split('@')[0]);
const birthday = ref('');

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
    emailAddress: props.email,
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

const usernameIsEmpty = computed(() => {
  if (!newUsername.value) {
    return true;
  }
  return newUsername.value.length === 0;
});

const validationErrorMessage = computed(() =>
  getUsernameValidationMessage({
    username: newUsername.value || '',
    isEmpty: usernameIsEmpty.value,
    isTaken: usernameIsTaken.value,
  })
);

const usernameIsInvalid = computed(
  () => !isValidUsername(newUsername.value || '')
);

const userAge = computed(() => calculateAge(birthday.value));

const birthdayIsEmpty = computed(
  () => !birthday.value || birthday.value.length === 0
);

const isUnderAge = computed(() => {
  if (birthdayIsEmpty.value) return false;
  return userAge.value < MIN_SIGNUP_AGE;
});

const birthdayValidationMessage = computed(() =>
  getBirthdayValidationMessage({ birthday: birthday.value })
);

const confirmedAvailable = computed(
  () =>
    !usernameIsTaken.value && !usernameIsEmpty.value && !usernameIsInvalid.value
);

const emit = defineEmits(['emailAndUserCreated']);

onEmailAndUserCreated((result) => {
  const user = result.data.createEmailAndUser;

  if (user) {
    const username = user?.username;
    const modProfileName = user?.ModerationProfile?.displayName;

    if (username) {
      setUsername(username);

      // Store username in localStorage for persistence
      localStorage.setItem('username', username);

      // Set the flag to prevent unnecessary checks
      sessionStorage.setItem('hasCheckedUsername', 'true');
    }

    if (modProfileName) {
      setModProfileName(modProfileName);
    }

    setIsAuthenticated(true);
    setIsLoadingAuth(false);

    emit('emailAndUserCreated');
  }
});

const updateUsername = (newUsernameString: string) => {
  newUsername.value = newUsernameString;
};

const updateBirthday = (newBirthdayString: string) => {
  birthday.value = newBirthdayString;
};

const usernameInput = ref<HTMLInputElement | null>(null);

nextTick(() => {
  usernameInput.value?.focus();
});

const canSave = computed(() => {
  if (usernameIsTaken.value) {
    return false;
  }
  if (usernameIsEmpty.value) {
    return false;
  }
  if (usernameIsInvalid.value) {
    return false;
  }
  if (newUsername.value && newUsername.value.length > MAX_CHARS_IN_USERNAME) {
    return false;
  }
  if (birthdayIsEmpty.value) {
    return false;
  }
  if (isUnderAge.value) {
    return false;
  }

  return true;
});
</script>

<template>
  <div>
    <div class="my-4 h-72 px-10 py-6">
      <h1 class="my-8 flex justify-center text-xl">Create Username</h1>
      <label
        for="username"
        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
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
              : 'focus:border-orange-500 focus:ring-orange-500',
          ]"
          class="block w-full flex-1 rounded border-gray-300 pb-2.5 pt-2.5 dark:bg-gray-800 sm:text-sm"
          @update:model-value="updateUsername"
        >
        <div
          v-if="usernameIsTaken || usernameIsInvalid"
          class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
        >
          <ExclamationIcon class="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>
      </div>

      <div>
        <p class="my-1 text-xs text-red-500">
          {{ validationErrorMessage }}
        </p>
        <CharCounter
          :current="newUsername?.length || 0"
          :max="MAX_CHARS_IN_USERNAME"
          class="text-xs"
        />
        <div v-if="confirmedAvailable" class="flex items-start">
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

      <!-- Birthday Field -->
      <div class="mt-6">
        <label
          for="birthday"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Birthday
        </label>
        <div class="relative mt-1 flex rounded-full shadow-sm">
          <DatePicker
            :value="birthday"
            test-id="birthday-picker"
            @update="updateBirthday"
          />
          <div
            v-if="isUnderAge"
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <ExclamationIcon class="h-5 w-5 text-red-500" aria-hidden="true" />
          </div>
        </div>
        <p class="my-1 text-xs text-red-500">
          {{ birthdayValidationMessage }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          You must be at least 13 years old to create an account
        </p>
      </div>

      <PrimaryButton
        class="float-right my-4"
        :label="'Save'"
        :disabled="!canSave"
        :loading="createEmailAndUserLoading"
        @click="createEmailAndUser"
      />
      <p v-if="createEmailAndUserLoading">Loading...</p>
    </div>
    <ErrorBanner
      v-if="createEmailAndUserError"
      class="mx-auto my-3 max-w-5xl"
      :text="createEmailAndUserError.message"
    />
  </div>
</template>

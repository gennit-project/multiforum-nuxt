<script setup lang="ts">
import { computed, ref } from 'vue';
import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable';
import type { AgePolicy, OwnAgeProfile } from '@/__generated__/graphql';
import GenericModal from '@/components/GenericModal.vue';
import DatePicker from '@/components/event/form/DatePicker.vue';
import ExclamationIcon from '@/components/icons/ExclamationIcon.vue';
import { GET_AGE_POLICY, GET_MY_AGE_PROFILE } from '@/graphQLData/age/queries';
import { SET_MY_BIRTHDAY } from '@/graphQLData/age/mutations';
import { useIsAuthenticated, useUsername } from '@/composables/useAuthState';
import { getAgeErrorMessage } from '@/utils/ageGating';
import { getBirthdayValidationMessage } from '@/utils/usernameValidation';

const isAuthenticated = useIsAuthenticated();
const username = useUsername();
const birthday = ref('');
const dismissed = ref(false);
const completed = ref(false);
const shouldLoadPolicy = computed(() => import.meta.client);
const shouldLoadProfile = computed(
  () => import.meta.client && isAuthenticated.value && Boolean(username.value)
);

const {
  result: policyResult,
  loading: policyLoading,
  error: policyError,
} = useQuery<{ getAgePolicy: AgePolicy }>(GET_AGE_POLICY, null, {
  enabled: shouldLoadPolicy,
});
const {
  result: profileResult,
  loading: profileLoading,
  error: profileError,
} = useQuery<{ getMyAgeProfile: OwnAgeProfile | null }>(
  GET_MY_AGE_PROFILE,
  null,
  { enabled: shouldLoadProfile }
);

const policy = computed(() => policyResult.value?.getAgePolicy);
const profile = computed(() => profileResult.value?.getMyAgeProfile);
const ageVerificationEnabled = computed(
  () =>
    policy.value?.accountAgeGateEnabled === true ||
    policy.value?.sensitiveContentAgeGateEnabled === true
);
const sensitiveContentNotice = computed(() => {
  if (!policy.value?.sensitiveContentAgeGateEnabled) return '';
  if (!isAuthenticated.value) {
    return 'Sensitive content is hidden. Sign in and confirm your birthday to view it.';
  }
  if (profileLoading.value || profileError.value || !profile.value) return '';
  if (profile.value.mayAccessSensitiveContent) return '';
  if (!profile.value.birthday) {
    return 'Sensitive content is hidden until you confirm your birthday.';
  }
  return `Sensitive content is hidden for accounts below ${policy.value.minimumSensitiveContentAge} years old.`;
});
const open = computed(
  () =>
    !dismissed.value &&
    !completed.value &&
    !policyLoading.value &&
    !profileLoading.value &&
    !policyError.value &&
    !profileError.value &&
    ageVerificationEnabled.value &&
    profile.value?.birthday === null
);
const validationMessage = computed(() =>
  getBirthdayValidationMessage({ birthday: birthday.value, minimumAge: null })
);

const { client } = useApolloClient();
const {
  mutate: setMyBirthday,
  loading: saving,
  error: saveError,
  onDone,
} = useMutation<{ setMyBirthday: OwnAgeProfile }>(SET_MY_BIRTHDAY, () => ({
  variables: { birthday: birthday.value },
}));
const saveDisabled = computed(
  () => Boolean(validationMessage.value) || saving.value
);

onDone(async () => {
  completed.value = true;
  await client.refetchQueries({ include: 'active' });
});

const updateBirthday = (value: string) => {
  birthday.value = value;
};
</script>

<template>
  <div
    v-if="sensitiveContentNotice"
    data-testid="sensitive-content-gate-notice"
    class="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
    role="status"
  >
    {{ sensitiveContentNotice }}
  </div>
  <GenericModal
    data-testid="age-profile-prompt"
    title="Confirm your age"
    body="Add your birthday to complete your age profile. Your birthday is private and only visible to you."
    primary-button-text="Save birthday"
    secondary-button-text="Not now"
    :open="open"
    :loading="saving"
    :primary-button-disabled="saveDisabled"
    :error="getAgeErrorMessage(saveError?.message)"
    @close="dismissed = true"
    @primary-button-click="setMyBirthday"
  >
    <template #icon>
      <ExclamationIcon class="h-6 w-6 text-orange-700 dark:text-orange-300" />
    </template>
    <template #content>
      <div class="py-3">
        <label
          for="age-profile-birthday"
          class="block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Birthday
        </label>
        <DatePicker
          :value="birthday"
          input-id="age-profile-birthday"
          test-id="age-profile-birthday"
          aria-label="Birthday"
          @update="updateBirthday"
        />
        <p
          v-if="validationMessage"
          id="age-profile-birthday-error"
          class="mt-1 text-xs text-red-600 dark:text-red-400"
          role="alert"
        >
          {{ validationMessage }}
        </p>
        <p class="mt-2 text-xs text-gray-600 dark:text-gray-300">
          This date cannot be changed after it is saved.
        </p>
      </div>
    </template>
  </GenericModal>
</template>

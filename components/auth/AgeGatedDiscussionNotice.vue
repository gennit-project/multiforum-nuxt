<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'nuxt/app';
import { useApolloClient, useMutation } from '@vue/apollo-composable';
import {
  AgeGateCheckStatus,
  type OwnAgeProfile,
} from '@/__generated__/graphql';
import DatePicker from '@/components/event/form/DatePicker.vue';
import { SET_MY_BIRTHDAY } from '@/graphQLData/age/mutations';
import { useAuthNavigation } from '@/composables/useAuthNavigation';
import { useDiscussionAgeGateCheck } from '@/composables/useDiscussionAgeGateCheck';
import { getAgeErrorMessage } from '@/utils/ageGating';
import { getBirthdayValidationMessage } from '@/utils/usernameValidation';

/*
Shown where a discussion or download page would say "not found". Restricted
viewers can't load a discussion marked sensitive, so this asks the backend
whether that's why, without receiving any of its content, and tells the viewer
what they need: to sign in, to add their birthday, or that they're too young.
When no age check applies, it renders the default slot (the not-found page).
*/
const props = defineProps<{
  discussionId: string;
}>();

const route = useRoute();
const { getLoginUrl } = useAuthNavigation();
const loginUrl = computed(() =>
  getLoginUrl(route.fullPath.split('#', 1)[0] || '/')
);

const { check, loading } = useDiscussionAgeGateCheck({
  discussionId: computed(() => props.discussionId),
  enabled: true,
});
const status = computed(() =>
  check.value?.requiresAgeCheck ? check.value.status : null
);
const minimumAge = computed(() => check.value?.minimumAge ?? 18);

const birthday = ref('');
const validationMessage = computed(() =>
  birthday.value
    ? getBirthdayValidationMessage({
        birthday: birthday.value,
        minimumAge: null,
      })
    : ''
);

const { client } = useApolloClient();
const {
  mutate: saveBirthday,
  loading: savingBirthday,
  error: saveBirthdayError,
  onDone: onBirthdaySaved,
} = useMutation<{ setMyBirthday: OwnAgeProfile }>(SET_MY_BIRTHDAY, () => ({
  variables: { birthday: birthday.value },
}));

// Reload the page's queries: an old-enough viewer now receives the discussion,
// and a younger one gets the refusal from a fresh check.
onBirthdaySaved(async () => {
  await client.refetchQueries({ include: 'active' });
});

const saveDisabled = computed(
  () =>
    !birthday.value || Boolean(validationMessage.value) || savingBirthday.value
);
</script>

<template>
  <div
    v-if="loading && !check"
    class="h-32 w-full"
    aria-busy="true"
    data-testid="age-gate-checking"
  />
  <section
    v-else-if="status"
    class="mx-4 my-8 w-full max-w-lg rounded-lg border border-amber-300 bg-amber-50 p-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
    aria-labelledby="age-gate-heading"
    data-testid="age-gate-notice"
    :data-status="status"
  >
    <h2 id="age-gate-heading" class="text-lg font-semibold">
      This content is marked sensitive
    </h2>

    <template v-if="status === AgeGateCheckStatus.SignInRequired">
      <p class="mt-2 text-sm">
        You must be {{ minimumAge }} or older to view it. Sign in to continue.
      </p>
      <a
        :href="loginUrl"
        class="mt-4 inline-flex rounded-md bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
        data-testid="age-gate-sign-in"
      >
        Sign in
      </a>
    </template>

    <template v-else-if="status === AgeGateCheckStatus.BirthdayRequired">
      <p class="mt-2 text-sm">
        You must be {{ minimumAge }} or older to view it. Enter your birthday to
        continue.
      </p>
      <form class="mt-4" @submit.prevent="saveBirthday()">
        <label
          for="age-gate-birthday"
          class="block text-sm font-medium text-amber-950 dark:text-amber-100"
        >
          Birthday
        </label>
        <DatePicker
          :value="birthday"
          input-id="age-gate-birthday"
          test-id="age-gate-birthday"
          aria-label="Birthday"
          @update="(value: string) => (birthday = value)"
        />
        <p
          v-if="validationMessage"
          class="mt-1 text-xs text-red-700 dark:text-red-300"
          role="alert"
        >
          {{ validationMessage }}
        </p>
        <p
          v-if="saveBirthdayError"
          class="mt-1 text-xs text-red-700 dark:text-red-300"
          role="alert"
        >
          {{ getAgeErrorMessage(saveBirthdayError.message) }}
        </p>
        <p class="mt-2 text-xs">
          Your birthday is private and only visible to you. It can't be changed
          after it's saved.
        </p>
        <button
          type="submit"
          class="mt-4 inline-flex rounded-md bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800 focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="saveDisabled"
          data-testid="age-gate-save-birthday"
        >
          {{ savingBirthday ? 'Saving…' : 'Save birthday' }}
        </button>
      </form>
    </template>

    <p v-else class="mt-2 text-sm" data-testid="age-gate-refusal">
      You can't view this content. It's only available to people
      {{ minimumAge }} or older.
    </p>
  </section>
  <slot v-else />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { navigateTo, useHead, useRoute, useRuntimeConfig } from 'nuxt/app';
import {
  buildLoginUrl,
  normalizeAuthProvider,
} from '@/composables/useAuthNavigation';

useHead({ title: 'Local sign in' });

const config = useRuntimeConfig();
const route = useRoute();
const provider = normalizeAuthProvider(config.public.authProvider);
const password = ref('');
const submitting = ref(false);
const errorMessage = ref('');

const returnTo = computed(() => {
  const requested = Array.isArray(route.query.returnTo)
    ? route.query.returnTo[0]
    : route.query.returnTo;
  return typeof requested === 'string' &&
    requested.startsWith('/') &&
    !requested.startsWith('//')
    ? requested
    : '/';
});

onMounted(() => {
  if (provider !== 'local-dev') {
    void navigateTo(
      buildLoginUrl({
        provider: 'auth0',
        returnTo: returnTo.value,
      }),
      { external: true }
    );
  }
});

const submit = async () => {
  if (!password.value || submitting.value) return;
  submitting.value = true;
  errorMessage.value = '';

  try {
    await $fetch('/api/auth/local-dev/login', {
      method: 'POST',
      body: { password: password.value },
    });
    await navigateTo(returnTo.value, { external: true });
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response
      ?.status;
    errorMessage.value =
      status === 401
        ? 'That password was not accepted.'
        : 'Local sign in is unavailable. Check the instance configuration.';
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <NuxtLayout>
    <div class="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <section
        v-if="provider === 'local-dev'"
        class="w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
        aria-labelledby="local-sign-in-title"
      >
        <p class="mb-2 text-sm font-medium text-amber-700 dark:text-amber-300">
          Local development authentication
        </p>
        <h1
          id="local-sign-in-title"
          class="font-semibold text-2xl dark:text-white"
        >
          Sign in to this instance
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Use the bootstrap password configured by the instance administrator.
          This sign-in mode is intended only for local self-hosting and
          evaluation.
        </p>

        <form class="mt-6 space-y-4" @submit.prevent="submit">
          <div>
            <label
              for="local-password"
              class="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Bootstrap password
            </label>
            <input
              id="local-password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <p
            v-if="errorMessage"
            role="alert"
            class="text-sm text-red-700 dark:text-red-300"
          >
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            :disabled="submitting || !password"
            class="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ submitting ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </section>
    </div>
  </NuxtLayout>
</template>

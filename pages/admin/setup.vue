<script setup lang="ts">
import { computed } from 'vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import {
  instanceCapabilityKeys,
  useInstanceSetupStatus,
  type InstanceCapabilityKey,
  type InstanceCapabilityStatus,
} from '@/composables/useInstanceSetupStatus';

const DOCS_BASE_URL = 'https://docs.multiforum.net';

const capabilityCopy: Record<
  InstanceCapabilityKey,
  { title: string; description: string }
> = {
  auth: {
    title: 'Authentication',
    description: 'Controls how people sign in to this instance.',
  },
  mail: {
    title: 'Email',
    description: 'Sends invitations, notifications, and account messages.',
  },
  maps: {
    title: 'Maps',
    description: 'Displays maps for events and location-aware features.',
  },
  geocoding: {
    title: 'Geocoding',
    description: 'Converts event addresses into map coordinates.',
  },
  uploads: {
    title: 'File uploads',
    description: 'Stores images and other user-uploaded files.',
  },
  downloads: {
    title: 'Downloads',
    description: 'Enables channels to publish downloadable files.',
  },
  events: {
    title: 'Events',
    description: 'Enables event publishing across the instance.',
  },
  plugins: {
    title: 'Plugins',
    description: 'Extends the instance with installed integrations and tools.',
  },
};

const { status, loading, error, refetch } = useInstanceSetupStatus();

const capabilities = computed(() =>
  instanceCapabilityKeys.flatMap((key) => {
    const capability = status.value?.[key];
    return capability ? [{ key, ...capabilityCopy[key], ...capability }] : [];
  })
);

const sectionId = (setupUrl: string) =>
  setupUrl.includes('#') ? setupUrl.split('#').pop() : undefined;

const docsUrl = (docsPath: string) =>
  `${DOCS_BASE_URL}${docsPath.startsWith('/') ? docsPath : `/${docsPath}`}`;

const stateLabel = (capability: InstanceCapabilityStatus) => {
  if (!capability.configured) return 'Setup required';
  if (!capability.enabled) return 'Configured, disabled';
  return 'Ready';
};

const stateClasses = (capability: InstanceCapabilityStatus) => {
  if (!capability.configured) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
  }
  if (!capability.enabled) {
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
  }
  return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
};
</script>

<template>
  <ClientOnly>
    <RequireAuth>
      <template #has-auth>
        <main class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Instance setup
            </h1>
            <p class="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300">
              Review which services are ready before enabling features for your
              community. Configuration remains environment-based; after making
              changes, restart the affected services and refresh this page.
            </p>
          </div>

          <div
            v-if="loading && !status"
            class="flex items-center justify-center rounded-lg border border-gray-200 py-12 text-gray-600 dark:border-gray-700 dark:text-gray-300"
            aria-live="polite"
          >
            <LoadingSpinner class="mr-3 inline-flex" />
            Checking instance capabilities...
          </div>

          <div
            v-else-if="error && !status"
            class="bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 p-5 dark:border-red-900"
            role="alert"
          >
            <h2 class="font-semibold text-red-800 dark:text-red-200">
              Setup status is unavailable
            </h2>
            <p class="mt-1 text-sm text-red-700 dark:text-red-300">
              Confirm that the backend supports the instance setup status query,
              then try again.
            </p>
            <button
              type="button"
              class="mt-4 rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              @click="refetch()"
            >
              Try again
            </button>
          </div>

          <div v-else class="grid gap-4 md:grid-cols-2">
            <section
              v-for="capability in capabilities"
              :id="sectionId(capability.setupUrl)"
              :key="capability.key"
              class="scroll-mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 class="font-semibold text-gray-900 dark:text-white">
                    {{ capability.title }}
                  </h2>
                  <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {{ capability.description }}
                  </p>
                </div>
                <span
                  class="font-semibold shrink-0 rounded-full px-2.5 py-1 text-xs"
                  :class="stateClasses(capability)"
                  :data-testid="`setup-state-${capability.key}`"
                >
                  {{ stateLabel(capability) }}
                </span>
              </div>

              <div
                v-if="capability.requiredEnvVarsMissing.length"
                class="mt-4 rounded-md bg-amber-50 p-3 dark:bg-amber-950/30"
              >
                <p
                  class="font-semibold text-xs uppercase tracking-wide text-amber-800 dark:text-amber-200"
                >
                  Missing environment variables
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <code
                    v-for="variable in capability.requiredEnvVarsMissing"
                    :key="variable"
                    class="rounded bg-white px-2 py-1 text-xs text-gray-800 ring-1 ring-amber-200 dark:bg-gray-900 dark:text-gray-100 dark:ring-amber-800"
                    >{{ variable }}</code
                  >
                </div>
              </div>

              <a
                :href="docsUrl(capability.docsPath)"
                class="mt-4 inline-flex text-sm font-medium text-orange-700 hover:text-orange-800 hover:underline dark:text-orange-300 dark:hover:text-orange-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                View setup documentation
                <span class="sr-only"> for {{ capability.title }}</span>
              </a>
            </section>
          </div>
        </main>
      </template>
      <template #does-not-have-auth>
        <div class="p-8 text-sm text-gray-700 dark:text-gray-200">
          You don't have permission to see this page.
        </div>
      </template>
    </RequireAuth>
  </ClientOnly>
</template>

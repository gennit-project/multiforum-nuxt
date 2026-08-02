<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { useRoute } from 'nuxt/app';
import CheckBox from '@/components/CheckBox.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { useToast } from '@/composables/useToast';
import { SET_CHANNEL_DISCUSSION_FLAIR_CONFIG } from '@/graphQLData/channel/mutations';
import { GET_CHANNEL_DISCUSSION_FLAIR_CONFIG } from '@/graphQLData/channel/queries';

type FlairOption = {
  id?: string;
  clientId: string;
  displayName: string;
  color: string;
  order: number;
  archived: boolean;
};

type FlairConfig = {
  flairRequired: boolean;
  flairs: Array<{
    id: string;
    displayName: string;
    color?: string | null;
    order: number;
    archived: boolean;
  }>;
};

type FlairConfigResult = {
  data?: { getChannelDiscussionFlairConfig?: FlairConfig };
};

const route = useRoute();
const toast = useToast();
const channelUniqueName = computed(() =>
  typeof route.params.forumId === 'string' ? route.params.forumId : ''
);
const flairRequired = ref(false);
const flairs = ref<FlairOption[]>([]);
const validationMessage = ref('');
let nextClientId = 0;

const activeFlairs = computed(() =>
  flairs.value.filter((flair) => !flair.archived)
);
const archivedFlairs = computed(() =>
  flairs.value.filter((flair) => flair.archived)
);

const applyConfig = (config?: FlairConfig) => {
  if (!config) return;
  flairRequired.value = config.flairRequired;
  flairs.value = [...config.flairs]
    .sort((left, right) => left.order - right.order)
    .map((flair) => ({
      id: flair.id,
      clientId: `saved-${flair.id}`,
      displayName: flair.displayName,
      color: flair.color || '',
      order: flair.order,
      archived: flair.archived,
    }));
};

const {
  loading,
  error: queryError,
  onResult,
} = useQuery(
  GET_CHANNEL_DISCUSSION_FLAIR_CONFIG,
  () => ({
    channelUniqueName: channelUniqueName.value,
    includeArchived: true,
  }),
  { enabled: computed(() => Boolean(channelUniqueName.value)) }
);

onResult((result: FlairConfigResult) => {
  applyConfig(result.data?.getChannelDiscussionFlairConfig);
});

const {
  mutate: saveConfig,
  loading: saving,
  error: mutationError,
  onDone,
} = useMutation(SET_CHANNEL_DISCUSSION_FLAIR_CONFIG);

onDone((result: FlairConfigResult) => {
  applyConfig(result.data?.getChannelDiscussionFlairConfig);
  validationMessage.value = '';
  toast.success('Post flair settings saved');
});

const addFlair = () => {
  nextClientId += 1;
  flairs.value.push({
    clientId: `new-${nextClientId}`,
    displayName: '',
    color: '#F97316',
    order: activeFlairs.value.length,
    archived: false,
  });
};

const archiveFlair = (flair: FlairOption) => {
  if (!flair.id) {
    flairs.value = flairs.value.filter(
      (candidate) => candidate.clientId !== flair.clientId
    );
    return;
  }
  flair.archived = true;
};

const moveFlair = (flair: FlairOption, offset: number) => {
  const currentIndex = activeFlairs.value.indexOf(flair);
  const target = activeFlairs.value[currentIndex + offset];
  if (!target) return;
  const currentOrder = flair.order;
  flair.order = target.order;
  target.order = currentOrder;
  flairs.value.sort((left, right) => left.order - right.order);
};

const colorPickerValue = (color: string) =>
  /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#F97316';

const validate = () => {
  const active = activeFlairs.value;
  if (flairRequired.value && active.length === 0) {
    return 'Add at least one active flair before requiring flairs.';
  }
  if (active.some((flair) => !flair.displayName.trim())) {
    return 'Each active flair needs a name.';
  }
  if (active.some((flair) => flair.displayName.trim().length > 40)) {
    return 'Flair names must be 40 characters or fewer.';
  }
  if (
    flairs.value.some(
      (flair) => flair.color && !/^#[0-9A-Fa-f]{6}$/.test(flair.color)
    )
  ) {
    return 'Flair colors must use six-digit hex values such as #F97316.';
  }
  const normalizedNames = active.map((flair) =>
    flair.displayName.trim().toLocaleLowerCase()
  );
  if (new Set(normalizedNames).size !== normalizedNames.length) {
    return 'Active flair names must be unique.';
  }
  return '';
};

const submit = async () => {
  validationMessage.value = validate();
  if (validationMessage.value) return;

  const activeOrder = new Map(
    activeFlairs.value.map((flair, index) => [flair.clientId, index])
  );
  try {
    await saveConfig({
      channelUniqueName: channelUniqueName.value,
      flairRequired: flairRequired.value,
      flairs: flairs.value.map((flair, index) => ({
        ...(flair.id ? { id: flair.id } : {}),
        displayName: flair.displayName.trim(),
        color: flair.color || null,
        order: flair.archived
          ? activeFlairs.value.length + index
          : activeOrder.get(flair.clientId),
        archived: flair.archived,
      })),
    });
  } catch {
    // The Apollo mutation error is rendered from mutationError above.
  }
};
</script>

<template>
  <section class="space-y-6" aria-labelledby="flair-settings-heading">
    <div>
      <h2
        id="flair-settings-heading"
        class="text-lg font-medium text-gray-900 dark:text-white"
      >
        Post Flairs
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Create categories that people can apply when submitting discussions to
        this forum.
      </p>
    </div>

    <div
      v-if="loading"
      class="flex items-center py-8 text-gray-600 dark:text-gray-300"
    >
      <LoadingSpinner class="mr-2" />
      Loading post flairs...
    </div>
    <ErrorBanner
      v-else-if="queryError"
      :text="`Unable to load post flairs: ${queryError.message}`"
    />

    <div v-else class="space-y-6">
      <div
        class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
      >
        <CheckBox
          id="require-post-flair"
          label="Require at least one flair on new discussions"
          :checked="flairRequired"
          @update="flairRequired = $event"
        />
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          This requirement applies whenever a discussion is submitted to this
          forum.
        </p>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between gap-4">
          <h3 class="font-medium text-gray-900 dark:text-white">
            Active flairs
          </h3>
          <button
            type="button"
            class="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            @click="addFlair"
          >
            Add flair
          </button>
        </div>

        <p
          v-if="activeFlairs.length === 0"
          class="rounded-md bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300"
        >
          This forum does not have any active post flairs yet.
        </p>

        <div
          v-for="(flair, index) in activeFlairs"
          :key="flair.clientId"
          class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
          data-testid="active-flair-row"
        >
          <div
            class="grid gap-4 md:grid-cols-[minmax(0,1fr)_11rem_auto] md:items-end"
          >
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Flair name
              <input
                v-model="flair.displayName"
                type="text"
                maxlength="40"
                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                :aria-label="`Flair name ${index + 1}`"
              >
            </label>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Color
              <span class="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  class="h-10 w-10 cursor-pointer rounded border border-gray-300 bg-transparent p-1 dark:border-gray-600"
                  :value="colorPickerValue(flair.color)"
                  :aria-label="`Choose color for ${flair.displayName || `flair ${index + 1}`}`"
                  @input="
                    flair.color = (
                      $event.target as HTMLInputElement
                    ).value.toUpperCase()
                  "
                >
                <input
                  v-model="flair.color"
                  type="text"
                  placeholder="#F97316"
                  class="block w-full min-w-0 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  :aria-label="`Hex color for ${flair.displayName || `flair ${index + 1}`}`"
                >
              </span>
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded border px-2 py-1 text-sm dark:border-gray-600"
                :disabled="index === 0"
                :aria-label="`Move ${flair.displayName || 'flair'} up`"
                @click="moveFlair(flair, -1)"
              >
                <i class="fa-solid fa-arrow-up" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="rounded border px-2 py-1 text-sm dark:border-gray-600"
                :disabled="index === activeFlairs.length - 1"
                :aria-label="`Move ${flair.displayName || 'flair'} down`"
                @click="moveFlair(flair, 1)"
              >
                <i class="fa-solid fa-arrow-down" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="rounded border border-red-300 px-2 py-1 text-sm text-red-700 dark:border-red-700 dark:text-red-300"
                @click="archiveFlair(flair)"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      </div>

      <details
        v-if="archivedFlairs.length"
        class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
      >
        <summary class="cursor-pointer font-medium text-gray-900 dark:text-white">
          Archived flairs ({{ archivedFlairs.length }})
        </summary>
        <ul class="mt-3 space-y-2">
          <li
            v-for="flair in archivedFlairs"
            :key="flair.clientId"
            class="flex items-center justify-between gap-3 rounded bg-gray-50 p-3 dark:bg-gray-800"
          >
            <span
              class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <span
                v-if="flair.color"
                class="h-3 w-3 rounded-full"
                :style="{ backgroundColor: flair.color }"
              />
              {{ flair.displayName }}
            </span>
            <button
              type="button"
              class="rounded border px-3 py-1 text-sm dark:border-gray-600"
              @click="flair.archived = false"
            >
              Restore
            </button>
          </li>
        </ul>
      </details>

      <ErrorBanner v-if="validationMessage" :text="validationMessage" />
      <ErrorBanner
        v-else-if="mutationError"
        :text="`Unable to save post flairs: ${mutationError.message}`"
      />

      <div class="flex justify-end">
        <button
          type="button"
          class="rounded-md bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="saving"
          @click="submit"
        >
          {{ saving ? 'Saving...' : 'Save flair settings' }}
        </button>
      </div>
    </div>
  </section>
</template>

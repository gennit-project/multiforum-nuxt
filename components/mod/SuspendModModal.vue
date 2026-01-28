<script setup lang="ts">
import { computed, ref } from 'vue';
import { DateTime } from 'luxon';
import GenericModal from '@/components/GenericModal.vue';
import TextEditor from '@/components/TextEditor.vue';
import UserMinus from '@/components/icons/UserMinus.vue';
import { useApolloClient, useMutation } from '@vue/apollo-composable';
import { GET_ISSUE } from '@/graphQLData/issue/queries';
import { IS_ORIGINAL_POSTER_SUSPENDED } from '@/graphQLData/mod/queries';
import { SUSPEND_MOD } from '@/graphQLData/mod/mutations';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  issueId: {
    type: String,
    required: false,
    default: '',
  },
  title: {
    type: String,
    required: false,
    default: '',
  },
});

const emit = defineEmits(['close', 'suspendedSuccessfully']);

const explanation = ref('');
const suspensionLength = ref<'' | 'two_weeks' | 'one_month' | 'indefinite'>(
  'two_weeks'
);

const client = useApolloClient().client;

const {
  mutate: suspendMod,
  loading: suspendModLoading,
  error: suspendModError,
  onDone: suspendModDone,
} = useMutation(SUSPEND_MOD, {
  update: (cache) => {
    cache.writeQuery({
      query: IS_ORIGINAL_POSTER_SUSPENDED,
      variables: {
        issueId: props.issueId,
      },
      data: {
        isOriginalPosterSuspended: true,
      },
    });
  },
});

suspendModDone(() => {
  client.refetchQueries({
    include: [GET_ISSUE],
  });
  emit('suspendedSuccessfully');
});

const modalTitle = computed(() => {
  return props.title || 'Suspend Mod';
});

const modalBody = computed(() => {
  return 'Select a suspension length and optionally explain why this mod is being suspended.';
});

const submit = async () => {
  if (!props.issueId) {
    console.error('No issue ID provided.');
    return;
  }

  let suspendUntil: string | null = null;
  let suspendIndefinitely = false;

  switch (suspensionLength.value) {
    case 'two_weeks':
      suspendUntil = DateTime.now().plus({ weeks: 2 }).toISO();
      break;
    case 'one_month':
      suspendUntil = DateTime.now().plus({ months: 1 }).toISO();
      break;
    case 'indefinite':
      suspendIndefinitely = true;
      break;
    default:
      suspendUntil = null;
  }

  await suspendMod({
    issueID: props.issueId,
    suspendUntil,
    suspendIndefinitely,
    explanation: explanation.value || undefined,
  });
};

const close = () => {
  emit('close');
};
</script>

<template>
  <GenericModal
    :highlight-color="'red'"
    :title="modalTitle"
    :open="open"
    :body="modalBody"
    :primary-button-text="'Submit'"
    :secondary-button-text="'Cancel'"
    :loading="suspendModLoading"
    :primary-button-disabled="!suspensionLength"
    :error="suspendModError?.message"
    @primary-button-click="submit"
    @close="close"
  >
    <template #icon>
      <UserMinus
        class="h-6 w-6 text-red-600 opacity-100 dark:text-red-400"
        aria-hidden="true"
      />
    </template>
    <template #content>
      <div class="flex flex-col gap-4">
        <label class="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Suspension Length
          <select
            v-model="suspensionLength"
            class="mt-2 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="two_weeks">Two Weeks</option>
            <option value="one_month">One Month</option>
            <option value="indefinite">Indefinite</option>
          </select>
        </label>
        <TextEditor
          :test-id="'report-discussion-input'"
          :initial-value="explanation"
          :disable-auto-focus="false"
          :allow-image-upload="false"
          @update="explanation = $event"
        />
      </div>
    </template>
  </GenericModal>
</template>

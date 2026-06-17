<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import GenericModal from '@/components/GenericModal.vue';
import FlagIcon from '@/components/icons/FlagIcon.vue';
import TextEditor from '@/components/TextEditor.vue';
import BrokenRuleListItem from '@/components/admin/BrokenRuleListItem.vue';
import { REPORT_PROFILE_PICTURE } from '@/graphQLData/issue/mutations';
import { GET_SERVER_RULES } from '@/graphQLData/admin/queries';
import { config } from '@/config';

type RuleOption = {
  summary: string;
  detail: string;
};

const props = defineProps({
  username: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: false,
    default: '',
  },
  open: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'reportSubmittedSuccessfully']);

const selectedServerRules = ref<string[]>([]);
const reportText = ref('');

const {
  loading: serverRulesLoading,
  error: serverRulesError,
  result: serverRulesResult,
} = useQuery(GET_SERVER_RULES, {
  serverName: config.serverName,
});

const getRules = (rulesJSON: string): RuleOption[] => {
  const rules: RuleOption[] = [];
  try {
    const rulesArray = JSON.parse(rulesJSON) || [];
    for (const rule of rulesArray) {
      rules.push({
        detail: rule.detail,
        summary: rule.summary,
      });
    }
  } catch (e) {
    console.error('Error parsing server rules', e);
  }
  return rules;
};

const serverRuleOptions = computed<RuleOption[]>(() => {
  const serverConfig = serverRulesResult.value?.serverConfigs?.[0];
  if (!serverConfig) {
    return [];
  }
  return getRules(serverConfig.rules);
});

const toggleServerRuleSelection = (rule: string) => {
  if (selectedServerRules.value.includes(rule)) {
    selectedServerRules.value = selectedServerRules.value.filter(
      (r) => r !== rule
    );
  } else {
    selectedServerRules.value = [...selectedServerRules.value, rule];
  }
};

const {
  mutate: reportProfilePicture,
  loading: reportProfilePictureLoading,
  error: reportProfilePictureError,
  onDone: reportProfilePictureDone,
} = useMutation(REPORT_PROFILE_PICTURE);

reportProfilePictureDone(() => {
  reportText.value = '';
  selectedServerRules.value = [];
  emit('reportSubmittedSuccessfully');
});

const modalTitle = computed(() => {
  const name = props.displayName || props.username;
  return `Report Profile Picture: ${name}`;
});

const submit = async () => {
  if (selectedServerRules.value.length === 0) {
    return;
  }

  reportProfilePicture({
    username: props.username,
    reportText: reportText.value,
    selectedServerRules: selectedServerRules.value,
  });
};

const close = () => {
  selectedServerRules.value = [];
  reportText.value = '';
  emit('close');
};
</script>

<template>
  <GenericModal
    data-testid="report-profile-picture-modal"
    :highlight-color="'red'"
    :title="modalTitle"
    :body="'Why are you reporting this profile picture?'"
    :open="open"
    :primary-button-text="'Submit Report'"
    :secondary-button-text="'Cancel'"
    :loading="reportProfilePictureLoading"
    :primary-button-disabled="selectedServerRules.length === 0"
    :error="reportProfilePictureError?.message"
    @primary-button-click="submit"
    @close="close"
  >
    <template #icon>
      <FlagIcon
        class="h-6 w-6 text-red-600 opacity-100 dark:text-red-400"
        aria-hidden="true"
      />
    </template>
    <template #content>
      <div
        class="w-full rounded-md border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <div v-if="serverRulesLoading">Loading...</div>

        <div v-else-if="serverRulesError" class="text-red-500">
          {{ serverRulesError?.message || 'Error loading server rules' }}
        </div>

        <template v-else>
          <div class="pl-1 pt-3">
            <h3 class="text-sm uppercase text-gray-700 dark:text-gray-300">
              Server Rules
            </h3>
            <div
              v-for="rule in serverRuleOptions"
              :key="rule.summary"
              class="border-b last:border-b-0 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <BrokenRuleListItem
                :rule="rule"
                :selected="selectedServerRules"
                @toggle-selection="() => toggleServerRuleSelection(rule.summary)"
              />
            </div>
            <div
              v-if="serverRuleOptions.length === 0"
              class="py-2 text-sm text-gray-500 dark:text-gray-400"
            >
              No server rules configured.
            </div>
          </div>
        </template>
      </div>

      <h2 class="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Additional context (optional):
      </h2>
      <TextEditor
        test-id="report-profile-picture-input"
        :initial-value="reportText"
        placeholder="Provide any additional context about why this profile picture should be reviewed"
        :disable-auto-focus="false"
        :allow-image-upload="false"
        @update="reportText = $event"
      />

      <div
        class="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-200"
      >
        <span class="font-medium">Note:</span> This report will be reviewed by
        server admins.
      </div>
    </template>
  </GenericModal>
</template>

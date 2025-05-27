<script lang="ts" setup>
import { ref, computed } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_CHANNEL_RULES } from "@/graphQLData/channel/queries";
import { GET_SERVER_RULES } from "@/graphQLData/admin/queries";
import BrokenRuleListItem from "./BrokenRuleListItem.vue";
import { config } from "@/config";
import { useRoute } from "nuxt/app";
import ErrorBanner from "@/components/ErrorBanner.vue";


type RuleOption = {
  summary: string;
  detail: string;
};

const emit = defineEmits([
  "toggleForumRuleSelection",
  "toggleServerRuleSelection",
]);
const selected = ref([]);
const route = useRoute();

const forumId = computed(() => {
  if (typeof route.params.forumId === "string") {
    return route.params.forumId;
  }
  return "";
});

const {
  loading: serverRulesLoading,
  error: serverRulesError,
  result: serverRulesResult,
} = useQuery(GET_SERVER_RULES, {
  serverName: config.serverName,
});

const {
  loading: channelRulesLoading,
  error: channelRulesError,
  result: channelRulesResult,
} = useQuery(GET_CHANNEL_RULES, {
  uniqueName: forumId,
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
    console.error("Error parsing channel rules", e);
  }
  return rules;
};

const forumRuleOptions = computed<RuleOption[]>(() => {
  const channel = channelRulesResult.value?.channels[0];
  if (!channel) {
    return [];
  }
  return getRules(channel.rules);
});

const serverRuleOptions = computed<RuleOption[]>(() => {
  const serverConfig = serverRulesResult.value?.serverConfigs[0];
  if (!serverConfig) {
    return [];
  }

  return getRules(serverConfig.rules);
});

const showServerRuleOptions = ref(forumRuleOptions.value.length === 0)
</script>

<template>
  <div
<<<<<<< HEAD
    class="w-full rounded-md border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-white"
=======
    class="w-full rounded-md border-gray-200 bg-white dark:text-white dark:border-gray-600 dark:bg-gray-800"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
  >
    <div v-if="channelRulesLoading || serverRulesLoading">Loading...</div>

    <div v-else-if="channelRulesError || serverRulesError">
      <ErrorBanner :text="serverRulesError" />
      <div v-for="(error, i) of channelRulesError?.graphQLErrors" :key="i">
        {{ error.message }}
      </div>
      <div v-for="(error, i) of serverRulesError?.graphQLErrors" :key="i">
        {{ error.message }}
      </div>
    </div>

    <template v-else>
      <div class="pl-1">
        <div v-if="forumRuleOptions.length > 0" class="pt-3">
          <h3 class="uppercase text-sm text-gray-700 dark:text-gray-300">
            Forum rules for {{ forumId }}
          </h3>
          <div
            v-for="rule in forumRuleOptions"
            :key="rule.summary"
            class="border-b last:border-b-0 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <BrokenRuleListItem
              :rule="rule"
              :selected="selected"
              @toggle-selection="
                () => emit('toggleForumRuleSelection', rule.summary)
              "
            />
          </div>
        </div>
        <div class="pt-3">
          <h3 class="uppercase text-sm text-gray-700 dark:text-gray-300">
            Server Rules
          </h3>
          <div v-if="showServerRuleOptions">
            <div
              v-for="rule in serverRuleOptions"
              :key="rule.summary"
              class="border-b last:border-b-0 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <BrokenRuleListItem
                :rule="rule"
                :selected="selected"
                @toggle-selection="
                  () => emit('toggleServerRuleSelection', rule.summary)
                "
              />
            </div>
          </div>
          <button
            v-if="forumRuleOptions.length > 0"
            class="border rounded-md border-gray-600 dark:border-gray-400 px-2 py-1 mt-2 text-sm text-gray-500 dark:text-gray-300"
            @click="showServerRuleOptions = !showServerRuleOptions"
          >
            {{ showServerRuleOptions ? "Hide" : "Show" }} Server Rules
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

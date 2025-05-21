<script lang="ts">
  import { defineComponent, ref, computed } from "vue";
  import MarkdownRenderer from "@/components/MarkdownRenderer.vue";

  type Rule = {
    detail: string;
    summary: string;
  };

  export default defineComponent({
    name: "RulesComponent",
    components: {
      MarkdownRenderer,
    },
    props: {
      rules: {
        type: String,
        default: "",
      },
    },
    setup(props) {
      const channelRules = computed(() => {
        const rules: Rule[] = [];
        try {
          const rulesArray = JSON.parse(props.rules) || [];
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
      });
      return {
        openRules: ref<Rule[]>(channelRules.value),
      };
    },
    methods: {
      toggleRule(ruleName: string) {
        const index = this.openRules.indexOf(ruleName);
        if (index > -1) {
          this.openRules.splice(index, 1); // Remove rule name from array if it's already there (collapse the panel)
        } else {
          this.openRules.push(ruleName); // Add rule name to array to expand the panel
        }
      },
      isOpen(ruleName: string) {
        return this.openRules.includes(ruleName);
      },
    },
  });
</script>

<template>
  <div class="divide-y">
    <div
      v-for="(rule, i) in openRules"
      :key="rule.summary"
      class="my-2 pt-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
    >
      <div
        v-if="rule.summary"
        class="flex items-center text-sm"
        :class="[rule.detail ? 'cursor-pointer' : '']"
        @click="
          () => {
            if (rule.detail) {
              toggleRule(rule.summary);
            }
          }
        "
      >
        <span class="mr-2 dark:text-gray-400">{{ `${i + 1}.` }}</span
        >{{ rule.summary }}
        <i
          v-if="rule.detail"
          :class="[
            'fa-solid',
            'h-3',
            'w-3',
            'text-xs',
            isOpen(rule.summary) ? 'fa-chevron-up' : 'fa-chevron-down',
            'ml-2',
          ]"
        />
      </div>
      <div
        v-if="isOpen(rule.summary)"
        class="mt-2"
      >
        <MarkdownRenderer
          class="text-gray-600 dark:text-gray-300"
          :text="rule.detail"
        />
      </div>
    </div>
  </div>
</template>

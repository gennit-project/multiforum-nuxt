<script lang="ts">
import { defineComponent } from "vue";
import CancelButton from "@/components/CancelButton.vue";
import SaveButton from "@/components/SaveButton.vue";
import FormRow from "@/components/forms/FormRow.vue";

export default defineComponent({
  name: "FormComponent",
  components: {
    CancelButton,
    FormRow,
    SaveButton,
  },
  props: {
    formTitle: {
      type: String,
      default: "",
    },
    needsChanges: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    showCancelButton: {
      type: Boolean,
      default: true,
    }
  },
  setup() {
  },
});
</script>

<template>
  <form
    class="rounded-lg space-y-3 divide-y divide-gray-200 border-gray-200 bg-white py-6 lg:py-12 dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800"
    autocomplete="off"
  >
    <div class="px-6 lg:px-14">
      <div class="flex justify-between">
        <h2
          class="font-semibold pt-3 text-base leading-7 text-gray-900 dark:text-gray-100"
        >
          {{ formTitle }}
        </h2>
        <div class="float-right">
          <CancelButton
            v-if="!loading && showCancelButton"
            @click.prevent="$router.go(-1)" 
          />
          <SaveButton
            :disabled="needsChanges"
            :loading="loading"
            @click.prevent="$emit('submit')"
          />
        </div>
      </div>
      <slot />
      <FormRow>
        <template #content>
          <div class="pb-5 pt-5">
            <div class="flex justify-end">
              <CancelButton 
                v-if="!loading && showCancelButton"
                @click.prevent="$router.go(-1)"
              />
              <SaveButton
                :disabled="needsChanges"
                :loading="loading"
                @click.prevent="$emit('submit')"
              />
            </div>
          </div>
        </template>
      </FormRow>
    </div>
  </form>
</template>

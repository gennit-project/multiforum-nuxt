<script setup lang="ts">
import { useRouter } from "nuxt/app";
import CancelButton from "@/components/CancelButton.vue";
import SaveButton from "@/components/SaveButton.vue";
import FormRow from "@/components/FormRow.vue";

const props = defineProps({
  formTitle: {
    type: String,
    default: "",
  },
  description: {
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
  },
  showButtonsInHeader: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["submit"]);
const router = useRouter();

function handleCancel() {
  router.go(-1);
}
</script>

<template>
  <form
    class="rounded-lg space-y-3 divide-y divide-gray-200 border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800 px-2 sm:px-4"
    autocomplete="off"
<<<<<<< HEAD
    class="space-y-3 divide-y divide-gray-200 rounded-lg border-gray-300 bg-white p-2 dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800 sm:px-4"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
  >
    <div>
      <div class="flex justify-between">
        <h2
          class="font-bold text-xl pt-3 leading-7 text-gray-900 dark:text-gray-100"
        >
          {{ props.formTitle }}
        </h2>

        <div v-if="showButtonsInHeader" class="float-right">
          <CancelButton
            v-if="!props.loading && props.showCancelButton"
            @click.prevent="handleCancel"
          />
          <SaveButton
            :disabled="props.needsChanges"
            :loading="props.loading"
            @click.prevent="emit('submit')"
          />
        </div>
      </div>
      <p
        v-if="description"
        class="mt-1 text-sm text-gray-500 dark:text-gray-400"
      >
        {{ props.description }}
      </p>
      <slot />
      <FormRow>
        <template #content>
          <div class="pb-5 pt-5">
            <div class="flex justify-end">
              <CancelButton
                v-if="!props.loading && props.showCancelButton"
                @click.prevent="handleCancel"
              />
              <SaveButton
                :disabled="props.needsChanges"
                :loading="props.loading"
                @click.prevent="emit('submit')"
              />
            </div>
          </div>
        </template>
      </FormRow>
    </div>
  </form>
</template>

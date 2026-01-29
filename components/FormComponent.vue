<script setup lang="ts">
import { useRouter } from 'nuxt/app';
import CancelButton from '@/components/CancelButton.vue';
import SaveButton from '@/components/SaveButton.vue';
import FormRow from '@/components/FormRow.vue';

const props = defineProps({
  formTitle: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
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
  handleCancelInParent: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['submit', 'cancel']);
const router = useRouter();

function handleCancel() {
  if (props.handleCancelInParent) {
    // Let the parent handle the cancel navigation
    emit('cancel');
  } else {
    // Use the default behavior (go back in history)
    router.go(-1);
  }
}
</script>

<template>
  <form
    autocomplete="off"
    class="space-y-3 divide-y divide-gray-200 rounded-lg border-gray-300 p-2 dark:divide-gray-700 dark:border-gray-700"
  >
    <div>
      <div class="flex justify-between">
        <h2
          v-if="props.formTitle"
          class="pt-3 text-xl font-bold leading-7 text-gray-900 dark:text-gray-100"
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

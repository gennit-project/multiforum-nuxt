<script setup lang="ts">
import { ref } from "vue";
import type { PropType } from "vue";
import { Listbox, ListboxOption, ListboxOptions } from "@headlessui/vue";
import ListboxButton from "@/components/ListboxButton.vue";
import CheckIcon from '@/components/icons/CheckIcon.vue';
import type { SelectOptionData } from "@/types/GenericFormTypes";

const props = defineProps({
  defaultOption: {
    type: Object as PropType<SelectOptionData | null>,
    required: false,
    default: null,
  },
  options: {
    type: Array as PropType<Array<SelectOptionData>>,
    required: true,
  },
});

const emit = defineEmits(['selected']);

const selected = ref(props.defaultOption || props.options[0]);

function handleSelect(event: SelectOptionData) {
  emit('selected', event);
}

</script>

<template>
  <Listbox
    v-model="selected"
    as="div"
    @update:model-value="handleSelect"
  >
    <div class="mt-1 relative">
      <ListboxButton
        class="
          bg-white dark:bg-gray-800
          dark:text-gray-200
          relative
          w-full
          border border-gray-300
          rounded-md
          shadow-sm
          pl-3
          pr-10
          text-left
          cursor-default
          focus:outline-none
          focus:ring-1
          focus:ring-orange-500
          focus:border-orange-500
        "
        :label="selected.label"
      >
        <span
          class="
            absolute
            inset-y-0
            right-0
            flex
            items-center
            pr-2
            pointer-events-none
          "
        />
      </ListboxButton>
      <ListboxOptions
        class="
          absolute
          z-10
          mt-1
          w-full
          bg-white dark:bg-gray-800
          dark:text-gray-200
          shadow-lg
          max-h-60
          rounded-md
          py-1
          text-base
          ring-1 ring-black ring-opacity-5
          overflow-auto
          focus:outline-none
          sm:text-sm
        "
      >
        <ListboxOption
          v-for="(option, i) in props.options"
          :key="i"
          v-slot="{ active, selected: isSelected }"
          as="template"
          :value="option"
        >
          <li
            :class="[
              active ? 'text-white bg-orange-600' : 'text-gray-900 dark:text-gray-200',
              'cursor-default select-none relative py-1 pl-3 pr-9',
            ]"
          >
            <span
              :class="[
                isSelected ? 'font-semibold' : 'font-normal',
                'block truncate',
              ]"
            >
              {{ option.label }}
            </span>

            <span
              v-if="isSelected"
              :class="[
                active ? 'text-white' : 'text-orange-600',
                'absolute inset-y-0 right-0 flex items-center pr-4',
              ]"
            >
              <CheckIcon
                class="h-5 w-5"
                aria-hidden="true"
              />
            </span>
          </li>
        </ListboxOption>
      </ListboxOptions>
    </div>
  </Listbox>
</template>

<script setup lang="ts">
  import { ref } from "vue";
  import type { PropType } from "vue";
  import { Listbox, ListboxOption, ListboxOptions } from "@headlessui/vue";
  import ListboxButton from "@/components/ListboxButton.vue";
  import CheckIcon from "@/components/icons/CheckIcon.vue";
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

  const emit = defineEmits(["selected"]);

  const selected = ref(props.defaultOption || props.options[0]);

  function handleSelect(event: SelectOptionData) {
    emit("selected", event);
  }
</script>

<template>
  <Listbox
    v-model="selected"
    as="div"
    @update:model-value="handleSelect"
  >
    <div class="relative mt-1">
      <ListboxButton
        class="relative w-full cursor-default rounded-md border border-gray-300 bg-white pl-3 pr-10 text-left shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:bg-gray-800 dark:text-gray-200"
        :label="selected.label"
      >
        <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2" />
      </ListboxButton>
      <ListboxOptions
        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:text-gray-200 sm:text-sm"
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
              active ? 'bg-orange-600 text-white' : 'text-gray-900 dark:text-gray-200',
              'relative cursor-default select-none py-1 pl-3 pr-9',
            ]"
          >
            <span :class="[isSelected ? 'font-semibold' : 'font-normal', 'block truncate']">
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
                aria-hidden="true"
                class="h-5 w-5"
              />
            </span>
          </li>
        </ListboxOption>
      </ListboxOptions>
    </div>
  </Listbox>
</template>

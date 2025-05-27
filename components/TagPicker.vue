<script lang="ts" setup>
<<<<<<< HEAD
  import { ref, watch } from "vue";
  import type { PropType } from "vue";
  import SearchableTagList from "@/components/SearchableTagList.vue";
  import FloatingDropdown from "@/components/FloatingDropdown.vue";
=======
import { ref, watch } from "vue";
import type { PropType } from "vue";
import SearchableTagList from "@/components/SearchableTagList.vue";
>>>>>>> parent of 666ae3d (Use automated formatting tools)

const props = defineProps({
  hideSelected: {
    type: Boolean,
    default: false,
  },
  selectedTags: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  description: {
    type: String,
    default: "",
  },
});
const emit = defineEmits(["setSelectedTags"]);

<<<<<<< HEAD
  const selected = ref([...props.selectedTags]);

  const toggleSelectedTag = (tag: string) => {
    const index = selected.value.indexOf(tag);
    if (index === -1) {
      selected.value.push(tag);
    } else {
      selected.value.splice(index, 1);
    }
    emit("setSelectedTags", selected.value);
  };
=======
const isDropdownOpen = ref(false);
const selected = ref([...props.selectedTags]);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const toggleSelectedTag = (tag: string) => {
  const index = selected.value.indexOf(tag);
  if (index === -1) {
    selected.value.push(tag);
  } else {
    selected.value.splice(index, 1);
  }
  emit("setSelectedTags", selected.value);
};
>>>>>>> parent of 666ae3d (Use automated formatting tools)

watch(
  () => props.selectedTags,
  (newVal) => {
    selected.value = [...newVal];
  }
);

<<<<<<< HEAD
=======
const outside = () => {
  isDropdownOpen.value = false;
};
>>>>>>> parent of 666ae3d (Use automated formatting tools)

const removeSelection = (tag: string) => {
  selected.value = selected.value.filter((c) => c !== tag);
  emit("setSelectedTags", selected.value);
};
</script>

<template>
  <div>
    <div v-if="description" class="py-1 text-sm dark:text-gray-300">
      {{ description }}
    </div>
<<<<<<< HEAD
    <FloatingDropdown placement="bottom-start">
      <template #trigger>
        <div
          class="flex min-h-10 w-full cursor-text flex-wrap items-center rounded-lg border border-gray-300 px-4 text-left text-sm dark:border-gray-700 dark:bg-gray-700"
        >
          <div
            v-if="selected.length === 0"
            class="text-gray-500 dark:text-gray-400"
          >
            There are no tags yet
          </div>
          <div
            v-for="(tag, index) in selected"
            :key="index"
            class="mr-2 mt-1 inline-flex items-center rounded-full bg-orange-100 px-2 text-orange-700 dark:bg-orange-700 dark:text-orange-100"
            @click="removeSelection(tag)"
          >
            <span>{{ tag }}</span>
            <span
              class="ml-1 cursor-pointer"
              @click.stop="removeSelection(tag)"
            >
              &times;
            </span>
          </div>
          <input
            class="bg-transparent flex-1 border-none text-sm focus:outline-none dark:text-white"
            data-testid="tag-picker"
            placeholder="Add a tag..."
          >
        </div>
      </template>

      <template #content>
        <SearchableTagList
          :selected-tags="selected"
          @toggle-selection="toggleSelectedTag"
        />
      </template>
    </FloatingDropdown>
=======
    <div class="relative"> 
      <div
        class="flex min-h-10 w-full cursor-text flex-wrap items-center rounded-lg border 
               px-4 text-left dark:border-gray-700 dark:bg-gray-700 text-sm"
        @click="toggleDropdown"
      >
        <div v-if="selected.length === 0" class="text-gray-500 dark:text-gray-400">
          There are no tags yet
        </div>
        <div
          v-for="(tag, index) in selected"
          :key="index"
          class="mr-2 mt-1 inline-flex items-center rounded-full bg-blue-100 
                 px-2 text-blue-700 dark:bg-blue-700 dark:text-blue-100"
          @click="removeSelection(tag)"
        >
          <span>{{ tag }}</span>
          <span class="ml-1 cursor-pointer" @click.stop="removeSelection(tag)">
            &times;
          </span>
        </div>
        <input
          data-testid="tag-picker"
          class="flex-1 border-none bg-transparent focus:outline-none dark:text-white text-sm"
          placeholder="Add a tag..."
        >
      </div>
      <SearchableTagList
        v-if="isDropdownOpen"
        v-click-outside="outside"
        :selected-tags="selected"
        @toggle-selection="toggleSelectedTag"
      />
    </div>
>>>>>>> parent of 666ae3d (Use automated formatting tools)
  </div>
</template>
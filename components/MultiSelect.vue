<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { PropType } from "vue";

export interface MultiSelectOption {
  value: any;
  label: string;
  icon?: string;
  avatar?: string;
  disabled?: boolean;
}

const props = defineProps({
  // Selected values
  modelValue: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
  // Available options
  options: {
    type: Array as PropType<MultiSelectOption[]>,
    default: () => [],
  },
  // Placeholder text when nothing selected
  placeholder: {
    type: String,
    default: "Select items...",
  },
  // Description text above the component
  description: {
    type: String,
    default: "",
  },
  // Test ID for testing
  testId: {
    type: String,
    default: "",
  },
  // Whether to show a search bar
  searchable: {
    type: Boolean,
    default: false,
  },
  // Search placeholder
  searchPlaceholder: {
    type: String,
    default: "Search...",
  },
  // Custom height for the container
  height: {
    type: String,
    default: "h-12",
  },
  // Whether to show chips for selected items
  showChips: {
    type: Boolean,
    default: true,
  },
  // Maximum height for the dropdown
  dropdownMaxHeight: {
    type: String,
    default: "max-h-64",
  },
  // Loading state
  loading: {
    type: Boolean,
    default: false,
  },
  // Error message
  error: {
    type: String,
    default: "",
  },
  // Whether multiple selection is allowed
  multiple: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits<{
  'update:modelValue': [value: any[]];
  'search': [query: string];
}>();

const isDropdownOpen = ref(false);
const searchQuery = ref("");
const selected = ref<any[]>([...props.modelValue]);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

const toggleSelection = (value: any) => {
  if (!props.multiple) {
    selected.value = selected.value.includes(value) ? [] : [value];
    closeDropdown();
  } else {
    const index = selected.value.indexOf(value);
    if (index === -1) {
      selected.value.push(value);
    } else {
      selected.value.splice(index, 1);
    }
  }
  emit('update:modelValue', selected.value);
};

const removeSelection = (value: any, event?: Event) => {
  if (event) {
    event.stopPropagation();
  }
  selected.value = selected.value.filter((item) => item !== value);
  emit('update:modelValue', selected.value);
};

const updateSearch = (query: string) => {
  searchQuery.value = query;
  emit('search', query);
};

// Filtered options based on search
const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return props.options;
  }
  
  return props.options.filter(option => 
    option.label.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Get option by value
const getOptionByValue = (value: any): MultiSelectOption | undefined => {
  return props.options.find(option => option.value === value);
};

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newVal) => {
    selected.value = [...newVal];
  }
);

// Selected options for display
const selectedOptions = computed(() => {
  return selected.value.map(value => getOptionByValue(value)).filter(Boolean) as MultiSelectOption[];
});
</script>

<template>
  <div>
    <div v-if="description" class="py-1 text-sm dark:text-gray-300">
      {{ description }}
    </div>
    
    <div v-if="error" class="mb-2 text-sm text-red-500">
      {{ error }}
    </div>
    
    <div class="relative">
      <div
        :data-testid="testId"
        :class="[
          'flex w-full cursor-pointer items-center rounded-lg border px-4 text-left dark:border-gray-700 dark:bg-gray-700',
          height,
          showChips ? 'min-h-10 flex-wrap' : ''
        ]"
        @click="toggleDropdown"
      >
        <!-- Selected items as chips -->
        <div v-if="showChips && selectedOptions.length > 0" class="flex flex-wrap gap-1">
          <div
            v-for="option in selectedOptions"
            :key="String(option.value)"
            class="mr-2 mt-1 inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-sm text-orange-700 dark:bg-orange-700 dark:text-orange-100"
          >
            <!-- Avatar if provided -->
            <img
              v-if="option.avatar"
              :src="option.avatar"
              :alt="option.label"
              class="mr-1 h-4 w-4 rounded-full"
            >
            <!-- Icon if provided -->
            <i v-else-if="option.icon" :class="[option.icon, 'mr-1']"></i>
            
            <span>{{ option.label }}</span>
            <span 
              class="ml-1 cursor-pointer hover:text-red-500"
              @click="removeSelection(option.value, $event)"
            >
              &times;
            </span>
          </div>
        </div>
        
        <!-- Single selection display (when not showing chips) -->
        <div v-else-if="!showChips && selectedOptions.length > 0" class="flex items-center">
          <img
            v-if="selectedOptions[0].avatar"
            :src="selectedOptions[0].avatar"
            :alt="selectedOptions[0].label"
            class="mr-2 h-6 w-6 rounded-full"
          >
          <i v-else-if="selectedOptions[0].icon" :class="[selectedOptions[0].icon, 'mr-2']"></i>
          <span class="text-gray-900 dark:text-white">{{ selectedOptions[0].label }}</span>
        </div>
        
        <!-- Placeholder -->
        <div 
          v-if="selectedOptions.length === 0" 
          class="text-gray-500 dark:text-gray-400"
        >
          {{ placeholder }}
        </div>
        
        <!-- Search input for chips mode -->
        <input
          v-if="showChips && searchable"
          v-model="searchQuery"
          class="flex-1 border-none bg-transparent focus:outline-none dark:text-white text-sm ml-2"
          :placeholder="selectedOptions.length === 0 ? searchPlaceholder : ''"
          @input="updateSearch(searchQuery)"
          @click.stop
        >
        
        <!-- Dropdown arrow -->
        <div class="ml-auto text-gray-400">
          <i :class="isDropdownOpen ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
        </div>
      </div>
      
      <!-- Dropdown -->
      <div
        v-if="isDropdownOpen"
        v-click-outside="closeDropdown"
        :class="[
          'absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg dark:bg-gray-800 dark:border-gray-600',
          dropdownMaxHeight,
          'overflow-y-auto'
        ]"
      >
        <!-- Search bar for dropdown -->
        <div v-if="searchable && !showChips" class="p-2 border-b border-gray-200 dark:border-gray-600">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            @input="updateSearch(searchQuery)"
          >
        </div>
        
        <!-- Loading state -->
        <div v-if="loading" class="p-4 text-center text-gray-500 dark:text-gray-400">
          Loading...
        </div>
        
        <!-- Options -->
        <div v-else-if="filteredOptions.length > 0" class="py-1">
          <div
            v-for="option in filteredOptions"
            :key="String(option.value)"
            :class="[
              'flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700',
              selected.includes(option.value) ? 'bg-orange-50 dark:bg-orange-900/20' : '',
              option.disabled ? 'opacity-50 cursor-not-allowed' : ''
            ]"
            @click="!option.disabled && toggleSelection(option.value)"
          >
            <!-- Checkbox for multiple selection -->
            <input
              v-if="multiple"
              type="checkbox"
              :checked="selected.includes(option.value)"
              :disabled="option.disabled"
              class="mr-3 text-orange-600 focus:ring-orange-500"
              @click.stop
            >
            
            <!-- Avatar -->
            <img
              v-if="option.avatar"
              :src="option.avatar"
              :alt="option.label"
              class="mr-3 h-6 w-6 rounded-full"
            >
            
            <!-- Icon -->
            <i v-else-if="option.icon" :class="[option.icon, 'mr-3']"></i>
            
            <!-- Label -->
            <span class="flex-1 text-sm text-gray-900 dark:text-white">
              {{ option.label }}
            </span>
            
            <!-- Selected indicator for single selection -->
            <i
              v-if="!multiple && selected.includes(option.value)"
              class="fa-solid fa-check text-orange-600"
            ></i>
          </div>
        </div>
        
        <!-- No options -->
        <div v-else class="p-4 text-center text-gray-500 dark:text-gray-400">
          No options available
        </div>
      </div>
    </div>
  </div>
</template>
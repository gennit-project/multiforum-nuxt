<script setup lang="ts">
import { ref, computed } from 'vue';
import { DateTime } from 'luxon';

const props = defineProps({
  value: {
    type: String,
    required: true
  },
  testId: {
    type: String,
    default: 'time-picker'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update']);

const isDropdownOpen = ref(false);

// Format the display time in 12-hour clock format
const formattedTime = computed(() => {
  const time = DateTime.fromFormat(props.value, "HH:mm");
  if (!time.isValid) return props.value;
  return time.toFormat("h:mm a"); // 12-hour format with AM/PM, no leading zeros
});

// Generate time options for the dropdown (15-minute intervals)
const timeOptions = computed(() => {
  const options = [];
  
  // Generate intervals of 15 minutes for a 24-hour period
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = DateTime.fromObject({ hour, minute });
      options.push({
        value: time.toFormat('HH:mm'), // 24-hour format for internal use
        display: time.toFormat('h:mm a'), // 12-hour format without leading zeros for display
        hour12: time.hour > 11 ? (time.hour === 12 ? 12 : time.hour - 12) : (time.hour === 0 ? 12 : time.hour),
        minute,
        period: time.hour >= 12 ? 'PM' : 'AM',
        dateTime: time
      });
    }
  }
  
  return options;
});

const selectTime = (value: string) => {
  emit('update', value);
  isDropdownOpen.value = false;
};

const toggleDropdown = () => {
  if (!props.disabled) {
    isDropdownOpen.value = !isDropdownOpen.value;
  }
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

</script>

<template>
  <div class="relative">
    <!-- Use a regular input for typing time directly -->
    <input
      type="time"
      :value="value"
      :data-testid="testId"
      class="border mt-2 rounded border-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500 w-32 h-10 px-3
            dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:[color-scheme:dark]"
      :disabled="disabled"
      @input="(e) => emit('update', (e.target as HTMLInputElement).value)"
    >
    
    <!-- Time dropdown toggle button -->
    <div class="absolute right-2 top-4 cursor-pointer" @click="toggleDropdown">
      <i class="far fa-clock text-gray-500 dark:text-gray-400"/>
    </div>
    
    <!-- Custom dropdown for time selection -->
    <div 
      v-if="isDropdownOpen"
      v-click-outside="closeDropdown"
      class="absolute z-10 left-0 top-full max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white touch-scroll-y"
      style="-webkit-overflow-scrolling: touch; scrollbar-width: thin;"
    >
      <!-- Using generated time options -->                        
      <template v-for="(option, index) in timeOptions" :key="'time-option-' + index">
        <!-- Create a new time group whenever we have a new hour (minutes === 0) -->
        <div v-if="option.minute === 0" class="border-b border-black/5 last:border-b-0 dark:border-white/5">
          <!-- For each group, render all options for that hour -->
          <div 
            v-for="hourOption in timeOptions.slice(index, index + 4)" 
            :key="'hour-' + hourOption.hour12 + '-min-' + hourOption.minute + '-' + hourOption.period"
            :class="[
              'py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm', 
              formattedTime === hourOption.display ? 'bg-blue-50 dark:bg-blue-900' : ''
            ]"
            @click="selectTime(hourOption.value)"
          >
            {{ hourOption.display }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
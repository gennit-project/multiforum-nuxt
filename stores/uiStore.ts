import { defineStore } from 'pinia';
import { ref } from 'vue';
import { config } from '@/config';

export type FontSize = 'small' | 'medium' | 'large';

export const useUIStore = defineStore('ui', () => {
  // State
  const sideNavIsOpen = ref(false);
  const enteredDevelopmentEnvironment = ref(config.environment === "development");
  const fontSize = ref<FontSize>('small');
  
  // Actions
  function setSideNavIsOpen(status: boolean) {
    // Necessary to prevent a bug in which the event list
    // event listeners interfere with navigation to the links
    // in the side nav. This state is used to turn off the 
    // event listeners in the event list when the side nav is open.
    sideNavIsOpen.value = status;
  }
  
  function setEnteredDevelopmentEnvironment(status: boolean) {
    enteredDevelopmentEnvironment.value = status;
  }

  function setFontSize(size: FontSize) {
    // Only update if it's actually changing to avoid unnecessary rerenders
    if (size !== fontSize.value) {
      fontSize.value = size;
    }
  }

  return {
    // State
    sideNavIsOpen,
    enteredDevelopmentEnvironment,
    fontSize,
    
    // Actions
    setSideNavIsOpen,
    setEnteredDevelopmentEnvironment,
    setFontSize
  };
});
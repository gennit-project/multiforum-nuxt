export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('click-outside', {
    beforeMount(el, binding) {
      el.clickOutsideEvent = function (event: Event) {
        // Check if the clicked element is outside the bound element
        if (!(el === event.target || el.contains(event.target as Node))) {
          // Call the provided callback function
          binding.value(event);
        }
      };
      document.addEventListener('click', el.clickOutsideEvent);
    },
    unmounted(el) {
      document.removeEventListener('click', el.clickOutsideEvent);
    },
  });
});
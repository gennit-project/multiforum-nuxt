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
      // Defer attaching the listener until after the current event loop tick.
      // When the element is mounted *by* a click (e.g. the click that opens a
      // dropdown/emoji picker), that same click keeps propagating to document;
      // attaching synchronously would let it immediately fire the outside-click
      // handler and close the thing that just opened.
      el.clickOutsideTimer = setTimeout(() => {
        document.addEventListener('click', el.clickOutsideEvent);
      }, 0);
    },
    unmounted(el) {
      clearTimeout(el.clickOutsideTimer);
      document.removeEventListener('click', el.clickOutsideEvent);
    },
  });
});

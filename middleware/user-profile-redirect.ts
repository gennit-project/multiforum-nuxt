import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app';

export default defineNuxtRouteMiddleware((to) => {
  if (to.name === 'u-username') {
    return navigateTo({
      name: 'u-username-comments',
      params: {
        username: to.params.username,
      },
      query: to.query,
    });
  }
});

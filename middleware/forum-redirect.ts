import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'

export default defineNuxtRouteMiddleware((to) => {
    if (to.name === 'forums-forumId') {
      return navigateTo({
        name: 'forums-forumId-discussions',
        params: {
          forumId: to.params.forumId
        }
      })
    }
  })
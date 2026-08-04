import { LOCAL_AUTH_COOKIE } from '@/server/utils/local-auth';

export default defineEventHandler((event) => {
  deleteCookie(event, LOCAL_AUTH_COOKIE, { path: '/' });
  return sendRedirect(event, '/', 302);
});

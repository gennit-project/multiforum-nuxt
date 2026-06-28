type RouteLike = {
  name?: string | symbol | null;
  path?: string | null;
};

export const isEventSearchRoute = (route: RouteLike | null | undefined) => {
  if (!route) return false;

  if (typeof route.name === 'string' && route.name.startsWith('events-list-search')) {
    return true;
  }

  return typeof route.path === 'string' && route.path.startsWith('/events/list/search');
};

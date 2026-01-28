import { defineEventHandler, type H3Event } from 'h3';

export default defineEventHandler((_event: H3Event) => {
  const env = process.env.VITE_ENVIRONMENT;

  if (env !== 'production') {
    return `User-agent: *
Disallow: /`;
  }

  return `User-agent: *
Allow: /

Disallow: /api/*
Disallow: /admin/*
Disallow: /mod/*
Disallow: /auth/*
Disallow: /_nuxt/*
Disallow: /assets/*
Disallow: /static/*
Disallow: /issues/*`;
});

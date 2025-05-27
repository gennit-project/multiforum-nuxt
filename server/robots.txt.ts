export default defineEventHandler((_event) => {
  const env = process.env.VITE_ENVIRONMENT;
  
  if (env === 'development') {
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
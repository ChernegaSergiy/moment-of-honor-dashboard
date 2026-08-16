// Persists the CMS Worker's base URL. The dashboard is a
// static site, and the base URL is injected at build time.

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || 'https://api.khvylyna.pp.ua';
}

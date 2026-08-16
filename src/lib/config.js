// Persists the CMS Worker's base URL in localStorage. The dashboard is a
// static site and has no build-time knowledge of where the Worker is
// deployed, so this is configured once by the author on first use.

const STORAGE_KEY = 'moh:apiBaseUrl';

export function getApiBaseUrl() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setApiBaseUrl(url) {
  localStorage.setItem(STORAGE_KEY, url.replace(/\/$/, ''));
}

export function clearApiBaseUrl() {
  localStorage.removeItem(STORAGE_KEY);
}

/** True when the configured API origin differs from the dashboard's own origin. */
export function isCrossOrigin(apiBaseUrl) {
  try {
    return new URL(apiBaseUrl).origin !== window.location.origin;
  } catch {
    return false;
  }
}

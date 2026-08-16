// Handles the sign-in flow against the CMS Worker's GitHub OAuth endpoints.
//
// The Worker's GET /auth/github accepts a `return_to` URL and, once signed
// in, redirects the browser straight back to it (see moment-of-honor-cms's
// README, "Cross-origin clients (CORS)"). So sign-in is a plain top-level
// navigation away and back — no popup, no manual "I've signed in" step.

export function redirectToSignIn(apiBaseUrl) {
  const returnTo = window.location.href.split('#')[0];
  const authorizeUrl = new URL(`${apiBaseUrl}/auth/github`);
  authorizeUrl.searchParams.set('return_to', returnTo);
  window.location.assign(authorizeUrl.toString());
}

/** True if the current URL is the post-sign-in redirect from the Worker. */
export function isSignInRedirect() {
  return new URLSearchParams(window.location.search).get('authenticated') === 'true';
}

export function getSignInError() {
  return new URLSearchParams(window.location.search).get('error');
}

/** Strips the `authenticated`/`login`/`error` query params added by the redirect. */
export function clearSignInRedirectParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete('authenticated');
  url.searchParams.delete('login');
  url.searchParams.delete('error');
  window.history.replaceState({}, '', url.toString());
}

export async function signOut(api) {
  await api.logout();
}

// Handles the sign-in flow against the CMS Worker's GitHub OAuth endpoints.
//
// The Worker's /auth/github/callback responds with a plain JSON confirmation
// rather than redirecting back to the dashboard, so sign-in opens in a new
// tab: the author completes GitHub's consent screen there, sees a small
// JSON confirmation, and returns to the dashboard tab to continue. Once the
// Worker and this dashboard share an origin (recommended production setup,
// see README) the session cookie set in that tab is immediately usable here.

export function openSignIn(apiBaseUrl) {
  window.open(`${apiBaseUrl}/auth/github`, '_blank', 'noopener');
}

export async function signOut(api) {
  await api.logout();
}

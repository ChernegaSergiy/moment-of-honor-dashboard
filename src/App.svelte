<script>
  import { onMount } from 'svelte';
  import { ApiClient } from './lib/utils/api.js';
  import { getApiBaseUrl } from './lib/utils/config.js';
  import { redirectToSignIn, isSignInRedirect, clearSignInRedirectParams, signOut, getSignInError } from './lib/utils/auth.js';
  import Posts from './lib/components/Posts.svelte';
  import Stories from './lib/components/Stories.svelte';
  import Media from './lib/components/Media.svelte';

  let api = null;
  let view = 'login'; // 'login', 'app'
  let activeTab = 'posts'; // 'posts', 'stories', 'media'
  let authStatusText = '';
  let statusMessage = '';
  let statusIsError = false;
  let showBanner = false;

  function displayBanner(msg, isErr = false) {
    statusMessage = msg;
    statusIsError = isErr;
    showBanner = true;
    setTimeout(() => { showBanner = false; }, 4000);
  }

  async function bootstrap() {
    const baseUrl = getApiBaseUrl();
    api = new ApiClient(baseUrl);
    const signInErr = getSignInError();
    if (signInErr) {
      clearSignInRedirectParams();
      displayBanner(signInErr, true);
    } else if (isSignInRedirect()) {
      clearSignInRedirectParams();
      displayBanner('Signed in successfully');
    }
    
    try {
      const authenticated = await api.checkSession();
      if (authenticated) {
        authStatusText = 'Connected';
        view = 'app';
      } else {
        view = 'login';
      }
    } catch (err) {
      displayBanner(err.message || 'Could not reach the CMS API', true);
      view = 'login';
    }
  }

  onMount(() => {
    bootstrap().catch(err => displayBanner(err.message || 'Unexpected error', true));
  });

  async function doSignOut() {
    try { await signOut(api); } catch {}
    authStatusText = '';
    view = 'login';
  }
</script>

{#if view === 'login'}
  <div class="auth-layout">
    <div class="auth-card">
      <h2 style="margin-bottom: 0.5rem; color: var(--primary);">Welcome Back</h2>
      <p style="color: var(--pico-muted-color); margin-bottom: 2rem;">Sign in to manage your CMS content.</p>
      
      <button on:click={() => redirectToSignIn(api.baseUrl)} style="width: 100%; border-radius: 99px; background-color: #24292e; border-color: #24292e;">
        Sign in with GitHub
      </button>
      
      <p style="margin-top: 1.5rem; font-size: 0.85rem; color: var(--pico-muted-color);">
        Secure authentication via GitHub OAuth.
      </p>
    </div>
  </div>
{/if}

{#if view === 'app'}
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        Moment of Honor
      </div>
      
      <nav>
        <ul>
          <li><a href="#" class:active={activeTab === 'posts'} on:click|preventDefault={() => activeTab = 'posts'}>Posts</a></li>
          <li><a href="#" class:active={activeTab === 'stories'} on:click|preventDefault={() => activeTab = 'stories'}>Stories</a></li>
          <li><a href="#" class:active={activeTab === 'media'} on:click|preventDefault={() => activeTab = 'media'}>Media</a></li>
        </ul>
      </nav>
    </aside>
    
    <div class="main-content">
      <div class="topbar">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span class="badge active">{authStatusText}</span>
          <button class="secondary outline" style="margin: 0; padding: 0.35rem 1rem; border-radius: 99px; font-size: 0.85rem;" on:click={doSignOut}>Sign out</button>
        </div>
      </div>
      
      <div class="content-area">
        {#if activeTab === 'posts'}<Posts {api} {displayBanner} />{/if}
        {#if activeTab === 'stories'}<Stories {api} {displayBanner} />{/if}
        {#if activeTab === 'media'}<Media {api} {displayBanner} />{/if}
      </div>
    </div>
  </div>
{/if}

{#if showBanner}
  <div class="moh-banner" class:moh-error={statusIsError}>
    <strong>{statusIsError ? 'Error' : 'Success'}:</strong> {statusMessage}
  </div>
{/if}

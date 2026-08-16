<script>
  import { onMount } from 'svelte';
  import { ApiClient } from './lib/api.js';
  import { getApiBaseUrl, setApiBaseUrl, isCrossOrigin } from './lib/config.js';
  import { redirectToSignIn, isSignInRedirect, clearSignInRedirectParams, signOut } from './lib/auth.js';
  import Posts from './lib/Posts.svelte';
  import Stories from './lib/Stories.svelte';
  import Media from './lib/Media.svelte';

  let api = null;
  let view = 'settings'; // 'settings', 'login', 'app'
  let activeTab = 'posts'; // 'posts', 'stories', 'media'
  let authStatusText = '';
  let statusMessage = '';
  let statusIsError = false;
  let showBanner = false;
  
  let settingsUrl = '';
  let crossOriginWarning = false;
  let crossOriginValue = '';

  function displayBanner(msg, isErr = false) {
    statusMessage = msg;
    statusIsError = isErr;
    showBanner = true;
    setTimeout(() => { showBanner = false; }, 4000);
  }

  async function bootstrap() {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      view = 'settings';
      settingsUrl = '';
      return;
    }
    
    settingsUrl = baseUrl;
    crossOriginWarning = isCrossOrigin(baseUrl);
    crossOriginValue = window.location.origin;
    
    api = new ApiClient(baseUrl);
    
    if (isSignInRedirect()) {
      clearSignInRedirectParams();
      displayBanner('Signed in');
    }
    
    try {
      const authenticated = await api.checkSession();
      if (authenticated) {
        authStatusText = 'Signed in';
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

  function saveSettings() {
    setApiBaseUrl(settingsUrl.trim());
    bootstrap();
  }

  async function doSignOut() {
    try { await signOut(api); } catch {}
    authStatusText = '';
    view = 'login';
  }
</script>

<header class="container">
  <nav>
    <ul>
      <li><strong>Moment of Honor</strong> — Dashboard</li>
    </ul>
    <ul>
      <li class="moh-meta">{authStatusText}</li>
      <li><a href="#" on:click|preventDefault={() => { settingsUrl = getApiBaseUrl(); view = 'settings'; }}>Settings</a></li>
      {#if authStatusText}
        <li><button class="secondary outline" on:click={doSignOut}>Sign out</button></li>
      {/if}
    </ul>
  </nav>
</header>

<main class="container">
  {#if view === 'settings'}
    <section>
      <h2>Settings</h2>
      <p>Enter the URL where the <code>moment-of-honor-cms</code> Worker is deployed.</p>
      <form on:submit|preventDefault={saveSettings}>
        <label>
          API base URL
          <input type="url" bind:value={settingsUrl} placeholder="https://api.example.com" required />
        </label>
        <button type="submit">Save</button>
      </form>
      {#if crossOriginWarning}
        <p class="moh-warning">
          This API URL is on a different origin than the dashboard. Cross-origin sign-in works, but the Worker must have this dashboard's origin (<code>{crossOriginValue}</code>) listed in its <code>ALLOWED_ORIGINS</code> configuration.
        </p>
      {/if}
    </section>
  {/if}

  {#if view === 'login'}
    <section>
      <h2>Sign in</h2>
      <p>Sign in with GitHub to manage posts, stories, and media.</p>
      <button on:click={() => redirectToSignIn(api.baseUrl)}>Sign in with GitHub</button>
      <p class="moh-meta">You'll be sent to GitHub and back automatically.</p>
    </section>
  {/if}

  {#if view === 'app'}
    <section>
      <nav>
        <ul>
          <li><a href="#" class:moh-tab-active={activeTab === 'posts'} class="moh-tab" on:click|preventDefault={() => activeTab = 'posts'}>Posts</a></li>
          <li><a href="#" class:moh-tab-active={activeTab === 'stories'} class="moh-tab" on:click|preventDefault={() => activeTab = 'stories'}>Stories</a></li>
          <li><a href="#" class:moh-tab-active={activeTab === 'media'} class="moh-tab" on:click|preventDefault={() => activeTab = 'media'}>Media</a></li>
        </ul>
      </nav>

      {#if activeTab === 'posts'}<Posts {api} {displayBanner} />{/if}
      {#if activeTab === 'stories'}<Stories {api} {displayBanner} />{/if}
      {#if activeTab === 'media'}<Media {api} {displayBanner} />{/if}
    </section>
  {/if}

  {#if showBanner}
    <div class="moh-banner" class:moh-error={statusIsError}>{statusMessage}</div>
  {/if}
</main>

<footer class="container">
  <p class="moh-meta">Talks to the <a href="https://github.com/ChernegaSergiy/moment-of-honor-cms" target="_blank" rel="noopener">moment-of-honor-cms</a> API.</p>
</footer>

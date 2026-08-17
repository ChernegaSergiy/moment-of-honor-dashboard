<script>
  import { onMount } from 'svelte';
  export let api;
  export let displayBanner;

  let kind = 'posts';
  let availableMedia = [];
  let isLoading = false;
  let fileInput;
  let isUploading = false;
  let uploadProgress = 0;

  async function loadMedia() {
    isLoading = true;
    try {
      availableMedia = await api.listMedia(kind);
    } catch (err) {
      displayBanner(err.message || 'Could not load media', true);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => loadMedia());

  async function handleTabChange(newKind) {
    kind = newKind;
    await loadMedia();
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    isUploading = true;
    uploadProgress = 0;
    try {
      await api.uploadMedia(file, kind, (pct) => {
        uploadProgress = pct;
      });
      displayBanner('Media uploaded successfully');
      await loadMedia();
    } catch (err) {
      displayBanner(err.message || 'Media upload failed', true);
    } finally {
      isUploading = false;
      uploadProgress = 0;
      if (fileInput) fileInput.value = '';
    }
  }

  async function deleteMedia(path) {
    if (!confirm(`Are you sure you want to delete ${path}?`)) return;
    
    try {
      await api.deleteMedia(path);
      displayBanner('Media deleted successfully');
      await loadMedia();
    } catch (err) {
      displayBanner(err.message || 'Could not delete media', true);
    }
  }

  async function copyPath(path) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(path);
      displayBanner('Path copied to clipboard!');
    } else {
      displayBanner('Copy not supported in this browser', true);
    }
  }
</script>

<div class="page-header">
  <div>
    <h1>Media Manager</h1>
    <p style="color: var(--pico-muted-color); margin: 0;">Manage your uploaded files.</p>
  </div>
  <div>
    <input type="file" accept="image/*,video/mp4" style="display: none" bind:this={fileInput} on:change={handleFileUpload} />
    <button type="button" style="border-radius: 99px; padding: 0.5rem 1.5rem; width: 150px;" on:click={() => fileInput.click()} disabled={isUploading}>
      {#if isUploading}
        <span aria-busy="true">{uploadProgress}%</span>
      {:else}
        + Upload
      {/if}
    </button>
  </div>
</div>

<nav style="margin-bottom: 2rem;">
  <ul>
    <li>
      <!-- svelte-ignore a11y-invalid-attribute -->
      <a href="#" class={kind === 'posts' ? 'secondary' : 'contrast'} on:click|preventDefault={() => handleTabChange('posts')}>Posts</a>
    </li>
    <li>
      <!-- svelte-ignore a11y-invalid-attribute -->
      <a href="#" class={kind === 'stories' ? 'secondary' : 'contrast'} on:click|preventDefault={() => handleTabChange('stories')}>Stories</a>
    </li>
  </ul>
</nav>

{#if isLoading}
  <article style="text-align: center; padding: 3rem; background-color: transparent; border: 2px dashed var(--pico-muted-border-color); box-shadow: none;">
    <p aria-busy="true">Loading media...</p>
  </article>
{:else if availableMedia.length === 0}
  <article style="text-align: center; padding: 3rem; background-color: transparent; border: 2px dashed var(--pico-muted-border-color); box-shadow: none;">
    <p style="color: var(--pico-muted-color); margin: 0;">No media files in this folder.</p>
  </article>
{:else}
  <div class="media-grid">
    {#each availableMedia as path}
      <article class="media-card">
        <div class="img-container">
          <img src="https://raw.githubusercontent.com/ChernegaSergiy/moment-of-honor-content/main/{path}" alt="media" loading="lazy" />
        </div>
        <footer>
          <div class="filename" title={path}>{path.split('/').pop()}</div>
          <div class="actions">
            <button class="secondary outline" on:click={() => copyPath(path)}>Copy Path</button>
            <button class="secondary outline del-btn" on:click={() => deleteMedia(path)}>Delete</button>
          </div>
        </footer>
      </article>
    {/each}
  </div>
{/if}

<style>
  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
  }
  .media-card {
    padding: 0;
    margin: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .img-container {
    aspect-ratio: 16/9;
    background-color: var(--pico-muted-border-color);
  }
  .img-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .media-card footer {
    padding: 0.75rem;
    margin: 0;
    background-color: var(--pico-card-sectioning-background-color);
  }
  .filename {
    font-size: 0.8rem;
    color: var(--pico-muted-color);
    margin-bottom: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  .actions button {
    margin: 0;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    flex: 1;
    border-radius: 4px;
  }
  .del-btn {
    color: var(--pico-del-color);
    border-color: var(--pico-del-color);
  }
</style>

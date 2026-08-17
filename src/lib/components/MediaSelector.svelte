<script>
  import { dndzone } from 'svelte-dnd-action';
  export let api;
  export let kind; // 'posts' or 'stories'
  export let mediaPaths = [];
  export let displayBanner;

  let showMediaGallery = false;
  let isLoadingMedia = false;
  let availableMedia = [];

  // dnd logic
  let dndItems = [];
  $: dndItems = mediaPaths.map(path => ({ id: path }));
  const flipDurationMs = 200;

  function handleDndConsider(e) {
    dndItems = e.detail.items;
  }

  function handleDndFinalize(e) {
    dndItems = e.detail.items;
    mediaPaths = dndItems.map(item => item.id);
  }

  async function openMediaGallery() {
    showMediaGallery = true;
    isLoadingMedia = true;
    try {
      availableMedia = await api.listMedia(kind);
    } catch (err) {
      displayBanner(err.message || 'Could not load media', true);
    } finally {
      isLoadingMedia = false;
    }
  }

  function toggleMediaSelection(path) {
    if (mediaPaths.includes(path)) {
      mediaPaths = mediaPaths.filter((p) => p !== path);
    } else {
      mediaPaths = [...mediaPaths, path];
    }
  }

  function removeMediaByPath(path) {
    mediaPaths = mediaPaths.filter((p) => p !== path);
  }

  let isUploading = false;
  let uploadProgress = 0;
  let fileInput;

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    isUploading = true;
    uploadProgress = 0;
    try {
      const result = await api.uploadMedia(file, kind, (pct) => {
        uploadProgress = pct;
      });
      
      // Refresh the available media list
      availableMedia = await api.listMedia(kind);
      
      // Automatically select the newly uploaded file
      if (result && result.path && !mediaPaths.includes(result.path)) {
        mediaPaths = [...mediaPaths, result.path];
      }
      
      displayBanner('Media uploaded successfully');
    } catch (err) {
      displayBanner(err.message || 'Could not upload media', true);
    } finally {
      isUploading = false;
      uploadProgress = 0;
      if (fileInput) fileInput.value = '';
    }
  }
</script>

<div>
  <label>Media (Drag to reorder)</label>
  {#if mediaPaths.length > 0}
    <div class="media-grid" use:dndzone={{items: dndItems, flipDurationMs}} on:consider={handleDndConsider} on:finalize={handleDndFinalize}>
      {#each dndItems as item (item.id)}
        <div>
          <div class="media-item">
            <img src="https://raw.githubusercontent.com/ChernegaSergiy/moment-of-honor-content/main/{item.id}" alt="media" draggable="false" />
          </div>
          <div class="media-controls">
            <button type="button" class="secondary outline" style="color: var(--pico-del-color); border-color: var(--pico-del-color);" on:click={() => removeMediaByPath(item.id)}>Remove</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
  <button type="button" class="secondary" style="border-radius: 99px; margin-bottom: 1rem;" on:click={openMediaGallery}>Select Media from Library</button>
</div>

{#if showMediaGallery}
  <dialog open>
    <article style="max-width: 800px; width: 100%;">
      <header style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0;">Media Library</h3>
        <div>
           <input type="file" accept="image/*,video/*" style="display: none" bind:this={fileInput} on:change={handleFileUpload} />
           <button type="button" class="secondary" style="margin: 0; border-radius: 99px; padding: 0.35rem 1rem; width: 140px;" on:click={() => fileInput.click()} disabled={isUploading}>
             {#if isUploading}
               <span aria-busy="true">{uploadProgress}%</span>
             {:else}
               + Upload
             {/if}
           </button>
        </div>
      </header>
      
      {#if isLoadingMedia}
        <p aria-busy="true" style="text-align: center; padding: 2rem;">Loading media...</p>
      {:else if availableMedia.length === 0}
        <p style="text-align: center; padding: 2rem; color: var(--pico-muted-color);">No media available in {kind} folder.</p>
      {:else}
        <div class="media-grid" style="grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));">
          {#each availableMedia as path}
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div 
              class="media-item {mediaPaths.includes(path) ? 'selected' : ''}" 
              on:click={() => toggleMediaSelection(path)}
              style="cursor: pointer;"
            >
              <img src="https://raw.githubusercontent.com/ChernegaSergiy/moment-of-honor-content/main/{path}" alt="gallery item" loading="lazy" />
              {#if mediaPaths.includes(path)}
                <div class="selected-overlay">✓</div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      <footer style="margin-top: 1rem; padding-bottom: 0;">
        <button type="button" style="border-radius: 99px; width: 100%;" on:click={() => showMediaGallery = false}>Done</button>
      </footer>
    </article>
  </dialog>
{/if}

<style>
  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .media-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid var(--pico-muted-border-color);
    background-color: var(--pico-form-element-background-color);
  }
  .media-item.selected {
    border-color: var(--primary);
  }
  .media-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .selected-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
  }
  .media-controls {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    gap: 0.25rem;
  }
  .media-controls button {
    padding: 0.15rem 0;
    margin: 0;
    flex: 1;
    font-size: 0.8rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>

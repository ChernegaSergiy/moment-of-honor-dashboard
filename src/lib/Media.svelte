<script>
  import { handleMediaUpload, copyToClipboard } from './media.js';
  export let api;
  export let displayBanner;

  let fileInput;
  let kind = 'posts';
  let uploadedPath = '';
  let showCopyBtn = false;
  let isUploading = false;

  async function onSubmit() {
    const file = fileInput.files[0];
    if (!file) return;

    isUploading = true;
    try {
      // Mocking the result container that handleMediaUpload expects
      const resultContainer = {
        set textContent(v) { this._text = v; },
        get textContent() { return this._text; },
        dataset: { path: '' }
      };

      await handleMediaUpload(api, file, kind, resultContainer);
      
      uploadedPath = resultContainer.textContent;
      showCopyBtn = !!resultContainer.dataset.path;
      if (showCopyBtn) {
        uploadedPath = resultContainer.dataset.path;
      }
    } catch (err) {
      showCopyBtn = false;
      displayBanner('Media upload failed', true);
    } finally {
      isUploading = false;
    }
  }

  async function onCopy() {
    const copied = await copyToClipboard(uploadedPath);
    displayBanner(copied ? 'Path copied to clipboard!' : 'Copy not supported in this browser');
  }
</script>

<div class="page-header">
  <div>
    <h1>Media Library</h1>
    <p style="color: var(--pico-muted-color); margin: 0;">Upload files to get a path for your content.</p>
  </div>
</div>

<article style="max-width: 600px; padding: 2rem;">
  <form on:submit|preventDefault={onSubmit}>
    <label>
      Destination Folder
      <select bind:value={kind}>
        <option value="posts">Posts</option>
        <option value="stories">Stories</option>
      </select>
    </label>
    
    <label>
      File
      <input type="file" bind:this={fileInput} accept="image/*,video/mp4" required style="margin-bottom: 1.5rem;" />
    </label>
    
    <button type="submit" aria-busy={isUploading} style="width: 100%; border-radius: 99px;">
      {isUploading ? 'Uploading...' : 'Upload Media'}
    </button>
  </form>

  {#if uploadedPath}
    <div style="margin-top: 2rem; padding: 1.5rem; background-color: var(--pico-form-element-background-color); border-radius: var(--pico-border-radius); border: 1px solid var(--pico-muted-border-color);">
      <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--primary);">Upload Successful!</div>
      <p style="margin-bottom: 1rem; word-break: break-all;">
        <code>{uploadedPath}</code>
      </p>
      {#if showCopyBtn}
        <button class="secondary" type="button" on:click={onCopy} style="width: 100%; border-radius: 99px;">Copy Path</button>
      {/if}
    </div>
  {/if}
</article>

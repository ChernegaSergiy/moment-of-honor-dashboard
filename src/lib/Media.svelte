<script>
  import { handleMediaUpload, copyToClipboard } from './media.js';
  export let api;
  export let displayBanner;

  let fileInput;
  let kind = 'posts';
  let uploadedPath = '';
  let showCopyBtn = false;

  async function onSubmit() {
    const file = fileInput.files[0];
    if (!file) return;

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
        // override uploadedPath to just show path
        uploadedPath = resultContainer.dataset.path;
      }
    } catch (err) {
      showCopyBtn = false;
      displayBanner('Media upload failed', true);
    }
  }

  async function onCopy() {
    const copied = await copyToClipboard(uploadedPath);
    displayBanner(copied ? 'Path copied' : 'Copy not supported in this browser');
  }
</script>

<h2>Media</h2>
<p>Upload a file, then copy its path into a post's or story's media list.</p>
<form on:submit|preventDefault={onSubmit}>
  <label>
    Kind
    <select bind:value={kind}>
      <option value="posts">Post</option>
      <option value="stories">Story</option>
    </select>
  </label>
  <label>
    File
    <input type="file" bind:this={fileInput} accept="image/*,video/mp4" required />
  </label>
  <button type="submit">Upload</button>
</form>

{#if uploadedPath}
  <p>
    <code>{uploadedPath}</code>
    {#if showCopyBtn}
      <button class="secondary outline" type="button" on:click={onCopy}>Copy</button>
    {/if}
  </p>
{/if}

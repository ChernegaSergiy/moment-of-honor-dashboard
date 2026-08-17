<script>
  import { onMount } from 'svelte';
  export let api;
  export let displayBanner;

  let posts = [];
  let showDialog = false;
  let editingPost = null;
  let formId = '';
  let formTitle = '';
  let formContent = '';
  let formMediaPaths = [];
  let formAuthor = '';
  let formPublishedAt = '';

  async function loadPosts() {
    try {
      posts = await api.listPosts();
    } catch (err) {
      displayBanner(err.message || 'Could not load posts', true);
    }
  }

  onMount(() => loadPosts());

  let initialFormState = {};
  let isSubmitting = false;

  function openDialog(post = null) {
    editingPost = post;
    if (post) {
      formId = post.id;
      formTitle = post.title;
      formContent = post.content;
      formMediaPaths = [...(post.media || [])];
      formAuthor = post.author;
      formPublishedAt = new Date(post.publishedAt).toISOString().slice(0, 16);
    } else {
      formId = '';
      formTitle = '';
      formContent = '';
      formMediaPaths = [];
      formAuthor = '';
      formPublishedAt = new Date().toISOString().slice(0, 16);
    }
    
    // Save state to detect unsaved changes later
    initialFormState = { formTitle, formContent, formMediaPaths: [...formMediaPaths], formAuthor, formPublishedAt };
    showDialog = true;
  }

  function closeDialog() {
    const isModified = formTitle !== initialFormState.formTitle ||
                       formContent !== initialFormState.formContent ||
                       JSON.stringify(formMediaPaths) !== JSON.stringify(initialFormState.formMediaPaths) ||
                       formAuthor !== initialFormState.formAuthor ||
                       formPublishedAt !== initialFormState.formPublishedAt;
                       
    if (isModified && !confirm("You have unsaved changes. Are you sure you want to close?")) {
      return;
    }
    showDialog = false;
  }

  async function savePost() {
    if (isSubmitting) return;
    isSubmitting = true;
    
    const payload = {
      title: formTitle,
      content: formContent,
      media: formMediaPaths,
      author: formAuthor,
      publishedAt: new Date(formPublishedAt).toISOString(),
    };
    try {
      if (formId) await api.updatePost(formId, payload);
      else await api.createPost(payload);
      showDialog = false;
      displayBanner('Post saved');
      await loadPosts();
    } catch (err) {
      displayBanner(err.message || 'Could not save post', true);
    } finally {
      isSubmitting = false;
    }
  }

  async function deletePost(post) {
    if (!confirm(`Delete post "${post.title}"?`)) return;
    try {
      await api.deletePost(post.id);
      displayBanner('Post deleted');
      await loadPosts();
    } catch (err) {
      displayBanner(err.message || 'Could not delete post', true);
    }
  }

  let showMediaGallery = false;
  let isLoadingMedia = false;
  let availableMedia = [];

  async function openMediaGallery() {
    showMediaGallery = true;
    isLoadingMedia = true;
    try {
      availableMedia = await api.listMedia('posts');
    } catch (err) {
      displayBanner(err.message || 'Could not load media', true);
    } finally {
      isLoadingMedia = false;
    }
  }

  function toggleMediaSelection(path) {
    if (formMediaPaths.includes(path)) {
      formMediaPaths = formMediaPaths.filter(p => p !== path);
    } else {
      formMediaPaths = [...formMediaPaths, path];
    }
  }

  function removeMedia(index) {
    formMediaPaths = formMediaPaths.filter((_, i) => i !== index);
  }

  function moveMediaUp(index) {
    if (index === 0) return;
    const item = formMediaPaths[index];
    formMediaPaths[index] = formMediaPaths[index - 1];
    formMediaPaths[index - 1] = item;
  }

  function moveMediaDown(index) {
    if (index === formMediaPaths.length - 1) return;
    const item = formMediaPaths[index];
    formMediaPaths[index] = formMediaPaths[index + 1];
    formMediaPaths[index + 1] = item;
  }
</script>

<div class="page-header">
  <div>
    <h1>Posts</h1>
    <p style="color: var(--pico-muted-color); margin: 0;">Manage your articles and announcements.</p>
  </div>
  <button style="border-radius: 99px; padding: 0.5rem 1.5rem;" on:click={() => openDialog()}>+ New Post</button>
</div>

{#if posts.length === 0}
  <article style="text-align: center; padding: 3rem; background-color: transparent; border: 2px dashed var(--pico-muted-border-color); box-shadow: none;">
    <p style="color: var(--pico-muted-color); margin: 0;">No posts yet. Create your first one!</p>
  </article>
{:else}
  <div class="card-grid">
    {#each posts as post}
      <article class="card">
        <header>{post.title}</header>
        <div class="content">
          <span class="badge">Author: {post.author}</span>
          <div class="moh-meta">
            Published: {new Date(post.publishedAt).toLocaleString()}
          </div>
        </div>
        <footer>
          <button class="secondary outline" style="border-radius: 99px; margin: 0; padding: 0.35rem 1rem; font-size: 0.85rem;" on:click={() => openDialog(post)}>Edit</button>
          <button class="secondary outline" style="border-radius: 99px; margin: 0; padding: 0.35rem 1rem; font-size: 0.85rem; color: var(--pico-del-color); border-color: var(--pico-del-color);" on:click={() => deletePost(post)}>Delete</button>
        </footer>
      </article>
    {/each}
  </div>
{/if}

{#if showDialog}
  <dialog open>
    <article style="max-width: 600px; width: 100%;">
      <header>
        <h3 style="margin: 0;">{editingPost ? 'Edit Post' : 'Create New Post'}</h3>
      </header>
      <form on:submit|preventDefault={savePost} style="margin: 1rem 0 0 0;">
        <label>
          Title
          <input type="text" bind:value={formTitle} required maxlength="200" />
        </label>
        
        <label>
          Content
          <textarea bind:value={formContent} rows="6" required></textarea>
        </label>
        
        <div>
          <label>Media</label>
          {#if formMediaPaths.length > 0}
            <div class="media-grid">
              {#each formMediaPaths as path, i}
                <div>
                  <div class="media-item">
                    <img src="https://raw.githubusercontent.com/ChernegaSergiy/moment-of-honor-content/main/{path}" alt="media" />
                  </div>
                  <div class="media-controls">
                    <button type="button" class="secondary outline" on:click={() => moveMediaUp(i)} disabled={i === 0}>↑</button>
                    <button type="button" class="secondary outline" on:click={() => moveMediaDown(i)} disabled={i === formMediaPaths.length - 1}>↓</button>
                    <button type="button" class="secondary outline" style="color: var(--pico-del-color); border-color: var(--pico-del-color);" on:click={() => removeMedia(i)}>✕</button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
          <button type="button" class="secondary" style="border-radius: 99px; margin-bottom: 1rem;" on:click={openMediaGallery}>Select Media from Library</button>
        </div>
        
        <div class="grid">
          <label>
            Author
            <input type="text" bind:value={formAuthor} required />
          </label>
          <label>
            Published at
            <input type="datetime-local" bind:value={formPublishedAt} required />
          </label>
        </div>
        
        <footer style="margin-top: 1rem; padding-bottom: 0;">
          <button type="button" class="secondary" style="border-radius: 99px;" on:click={closeDialog} disabled={isSubmitting}>Cancel</button>
          <button type="submit" style="border-radius: 99px;" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (editingPost ? 'Save Post' : 'Create Post')}
          </button>
        </footer>
      </form>
    </article>
  </dialog>
{/if}

{#if showMediaGallery}
  <dialog open>
    <article style="max-width: 800px; width: 100%;">
      <header>
        <h3 style="margin: 0;">Media Library</h3>
      </header>
      
      {#if isLoadingMedia}
        <p aria-busy="true" style="text-align: center; padding: 2rem;">Loading media...</p>
      {:else if availableMedia.length === 0}
        <p style="text-align: center; padding: 2rem; color: var(--pico-muted-color);">No media available in posts folder.</p>
      {:else}
        <div class="media-grid" style="grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));">
          {#each availableMedia as path}
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
            <div 
              class="media-item {formMediaPaths.includes(path) ? 'selected' : ''}" 
              on:click={() => toggleMediaSelection(path)}
              style="cursor: pointer;"
            >
              <img src="https://raw.githubusercontent.com/ChernegaSergiy/moment-of-honor-content/main/{path}" alt="gallery item" loading="lazy" />
              {#if formMediaPaths.includes(path)}
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

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
  let formMedia = '';
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
      formMedia = (post.media || []).join(', ');
      formAuthor = post.author;
      formPublishedAt = new Date(post.publishedAt).toISOString().slice(0, 16);
    } else {
      formId = '';
      formTitle = '';
      formContent = '';
      formMedia = '';
      formAuthor = '';
      formPublishedAt = new Date().toISOString().slice(0, 16);
    }
    
    // Save state to detect unsaved changes later
    initialFormState = { formTitle, formContent, formMedia, formAuthor, formPublishedAt };
    showDialog = true;
  }

  function closeDialog() {
    const isModified = formTitle !== initialFormState.formTitle ||
                       formContent !== initialFormState.formContent ||
                       formMedia !== initialFormState.formMedia ||
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
      media: formMedia.split(',').map(s => s.trim()).filter(Boolean),
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
        
        <label>
          Media paths (comma-separated)
          <input type="text" bind:value={formMedia} placeholder="media/posts/example.jpg" />
        </label>
        
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

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
    showDialog = true;
  }

  async function savePost() {
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

<div class="moh-panel-header">
  <h2>Posts</h2>
  <button on:click={() => openDialog()}>New post</button>
</div>

<div class="moh-list">
  {#if posts.length === 0}
    <p>No posts yet.</p>
  {/if}
  {#each posts as post}
    <article class="moh-list-item">
      <div>
        <strong>{post.title}</strong>
        <div class="moh-meta">{new Date(post.publishedAt).toLocaleString()} • {post.author}</div>
      </div>
      <div>
        <button class="secondary outline" style="padding:0.25rem 0.5rem;font-size:0.8rem;" on:click={() => openDialog(post)}>Edit</button>
        <button class="secondary outline" style="padding:0.25rem 0.5rem;font-size:0.8rem;color:var(--pico-del-color);border-color:var(--pico-del-color);" on:click={() => deletePost(post)}>Delete</button>
      </div>
    </article>
  {/each}
</div>

{#if showDialog}
  <dialog open>
    <article>
      <header>
        <h3>{editingPost ? 'Edit post' : 'New post'}</h3>
      </header>
      <form on:submit|preventDefault={savePost}>
        <label>Title <input type="text" bind:value={formTitle} required maxlength="200" /></label>
        <label>Content <textarea bind:value={formContent} rows="6" required></textarea></label>
        <label>Media paths (comma-separated) <input type="text" bind:value={formMedia} placeholder="media/posts/example.jpg" /></label>
        <label>Author <input type="text" bind:value={formAuthor} required /></label>
        <label>Published at <input type="datetime-local" bind:value={formPublishedAt} required /></label>
        <footer>
          <button type="button" class="secondary" on:click={() => showDialog = false}>Cancel</button>
          <button type="submit">Save</button>
        </footer>
      </form>
    </article>
  </dialog>
{/if}

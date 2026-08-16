<script>
  import { onMount } from 'svelte';
  export let api;
  export let displayBanner;

  let stories = [];
  let showDialog = false;
  let editingStory = null;
  let formId = '';
  let formMedia = '';
  let formAuthor = '';
  let formPublishedAt = '';
  let formExpiresAt = '';

  async function loadStories() {
    try {
      stories = await api.listStories();
    } catch (err) {
      displayBanner(err.message || 'Could not load stories', true);
    }
  }

  onMount(() => loadStories());

  function openDialog(story = null) {
    editingStory = story;
    if (story) {
      formId = story.id;
      formMedia = (story.media || []).join(', ');
      formAuthor = story.author || '';
      formPublishedAt = new Date(story.publishedAt).toISOString().slice(0, 16);
      formExpiresAt = new Date(story.expiresAt).toISOString().slice(0, 16);
    } else {
      formId = '';
      formMedia = '';
      formAuthor = '';
      const now = new Date();
      formPublishedAt = now.toISOString().slice(0, 16);
      now.setDate(now.getDate() + 1);
      formExpiresAt = now.toISOString().slice(0, 16);
    }
    showDialog = true;
  }

  async function saveStory() {
    const payload = {
      media: formMedia.split(',').map(s => s.trim()).filter(Boolean),
      author: formAuthor || undefined,
      publishedAt: new Date(formPublishedAt).toISOString(),
      expiresAt: new Date(formExpiresAt).toISOString(),
    };
    try {
      if (formId) await api.updateStory(formId, payload);
      else await api.createStory(payload);
      showDialog = false;
      displayBanner('Story saved');
      await loadStories();
    } catch (err) {
      displayBanner(err.message || 'Could not save story', true);
    }
  }

  async function deleteStory(story) {
    if (!confirm(`Delete story "${story.id}"?`)) return;
    try {
      await api.deleteStory(story.id);
      displayBanner('Story deleted');
      await loadStories();
    } catch (err) {
      displayBanner(err.message || 'Could not delete story', true);
    }
  }
</script>

<div class="moh-panel-header">
  <h2>Stories</h2>
  <button on:click={() => openDialog()}>New story</button>
</div>

<div class="moh-list">
  {#if stories.length === 0}
    <p>No stories yet.</p>
  {/if}
  {#each stories as story}
    <article class="moh-list-item">
      <div>
        <strong>Story {story.id}</strong>
        <div class="moh-meta">{new Date(story.publishedAt).toLocaleString()} • Expires: {new Date(story.expiresAt).toLocaleString()}</div>
      </div>
      <div>
        <button class="secondary outline" style="padding:0.25rem 0.5rem;font-size:0.8rem;" on:click={() => openDialog(story)}>Edit</button>
        <button class="secondary outline" style="padding:0.25rem 0.5rem;font-size:0.8rem;color:var(--pico-del-color);border-color:var(--pico-del-color);" on:click={() => deleteStory(story)}>Delete</button>
      </div>
    </article>
  {/each}
</div>

{#if showDialog}
  <dialog open>
    <article>
      <header>
        <h3>{editingStory ? 'Edit story' : 'New story'}</h3>
      </header>
      <form on:submit|preventDefault={saveStory}>
        <label>Media paths (comma-separated) <input type="text" bind:value={formMedia} placeholder="media/stories/example.jpg" required /></label>
        <label>Author (optional) <input type="text" bind:value={formAuthor} /></label>
        <label>Published at <input type="datetime-local" bind:value={formPublishedAt} required /></label>
        <label>Expires at <input type="datetime-local" bind:value={formExpiresAt} required /></label>
        <footer>
          <button type="button" class="secondary" on:click={() => showDialog = false}>Cancel</button>
          <button type="submit">Save</button>
        </footer>
      </form>
    </article>
  </dialog>
{/if}

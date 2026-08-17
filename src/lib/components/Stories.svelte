<script>
  import { onMount } from 'svelte';
  export let api;
  export let displayBanner;

  let stories = [];
  let showDialog = false;
  let editingStory = null;
  let formId = '';
  let formMediaPaths = [];
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

  let initialFormState = {};
  let isSubmitting = false;

  function openDialog(story = null) {
    editingStory = story;
    if (story) {
      formId = story.id;
      formMediaPaths = [...(story.media || [])];
      formAuthor = story.author || '';
      formPublishedAt = new Date(story.publishedAt).toISOString().slice(0, 16);
      formExpiresAt = new Date(story.expiresAt).toISOString().slice(0, 16);
    } else {
      formId = '';
      formMediaPaths = [];
      formAuthor = '';
      const now = new Date();
      formPublishedAt = now.toISOString().slice(0, 16);
      now.setDate(now.getDate() + 1);
      formExpiresAt = now.toISOString().slice(0, 16);
    }
    
    initialFormState = { formMediaPaths: [...formMediaPaths], formAuthor, formPublishedAt, formExpiresAt };
    showDialog = true;
  }

  function closeDialog() {
    const isModified = JSON.stringify(formMediaPaths) !== JSON.stringify(initialFormState.formMediaPaths) ||
                       formAuthor !== initialFormState.formAuthor ||
                       formPublishedAt !== initialFormState.formPublishedAt ||
                       formExpiresAt !== initialFormState.formExpiresAt;
                       
    if (isModified && !confirm("You have unsaved changes. Are you sure you want to close?")) {
      return;
    }
    showDialog = false;
  }

  async function saveStory() {
    if (isSubmitting) return;
    isSubmitting = true;
    
    const payload = {
      media: formMediaPaths,
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
    } finally {
      isSubmitting = false;
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

  import MediaSelector from './MediaSelector.svelte';
</script>

<div class="page-header">
  <div>
    <h1>Stories</h1>
    <p style="color: var(--pico-muted-color); margin: 0;">Manage ephemeral content.</p>
  </div>
  <button style="border-radius: 99px; padding: 0.5rem 1.5rem;" on:click={() => openDialog()}>+ New Story</button>
</div>

{#if stories.length === 0}
  <article style="text-align: center; padding: 3rem; background-color: transparent; border: 2px dashed var(--pico-muted-border-color); box-shadow: none;">
    <p style="color: var(--pico-muted-color); margin: 0;">No stories yet. Create your first one!</p>
  </article>
{:else}
  <div class="card-grid">
    {#each stories as story}
      <article class="card">
        <header>Story {story.id}</header>
        <div class="content">
          {#if story.author}<span class="badge">Author: {story.author}</span>{/if}
          <div class="moh-meta">
            <strong>Published:</strong> {new Date(story.publishedAt).toLocaleString()}
          </div>
          <div class="moh-meta">
            <strong>Expires:</strong> {new Date(story.expiresAt).toLocaleString()}
          </div>
        </div>
        <footer>
          <button class="secondary outline" style="border-radius: 99px; margin: 0; padding: 0.35rem 1rem; font-size: 0.85rem;" on:click={() => openDialog(story)}>Edit</button>
          <button class="secondary outline" style="border-radius: 99px; margin: 0; padding: 0.35rem 1rem; font-size: 0.85rem; color: var(--pico-del-color); border-color: var(--pico-del-color);" on:click={() => deleteStory(story)}>Delete</button>
        </footer>
      </article>
    {/each}
  </div>
{/if}

{#if showDialog}
  <dialog open>
    <article style="max-width: 600px; width: 100%;">
      <header>
        <h3 style="margin: 0;">{editingStory ? 'Edit Story' : 'Create New Story'}</h3>
      </header>
      <form on:submit|preventDefault={saveStory} style="margin: 1rem 0 0 0;">
        <MediaSelector bind:mediaPaths={formMediaPaths} {api} {displayBanner} kind="stories" />
        
        <label>
          Author (optional)
          <input type="text" bind:value={formAuthor} />
        </label>
        
        <div class="grid">
          <label>
            Published at
            <input type="datetime-local" bind:value={formPublishedAt} required />
          </label>
          <label>
            Expires at
            <input type="datetime-local" bind:value={formExpiresAt} required />
          </label>
        </div>
        
        <footer style="margin-top: 1rem; padding-bottom: 0;">
          <button type="button" class="secondary" style="border-radius: 99px;" on:click={closeDialog} disabled={isSubmitting}>Cancel</button>
          <button type="submit" style="border-radius: 99px;" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (editingStory ? 'Save Story' : 'Create Story')}
          </button>
        </footer>
      </form>
    </article>
  </dialog>
{/if}



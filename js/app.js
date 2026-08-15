import { ApiClient, ApiError } from './api.js';
import { getApiBaseUrl, setApiBaseUrl, isCrossOrigin } from './config.js';
import { redirectToSignIn, isSignInRedirect, clearSignInRedirectParams, signOut } from './auth.js';
import { renderPosts, fillPostForm, readPostForm } from './posts.js';
import { renderStories, fillStoryForm, readStoryForm } from './stories.js';
import { handleMediaUpload, copyToClipboard } from './media.js';

const settingsView = document.getElementById('settings-view');
const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const authStatus = document.getElementById('auth-status');
const signOutBtn = document.getElementById('sign-out-btn');
const statusBanner = document.getElementById('status-banner');
const crossOriginWarning = document.getElementById('cross-origin-warning');

let api = null;

function showBanner(message, isError = false) {
  statusBanner.textContent = message;
  statusBanner.hidden = false;
  statusBanner.classList.toggle('moh-error', isError);
  setTimeout(() => {
    statusBanner.hidden = true;
  }, 4000);
}

function setView(view) {
  settingsView.hidden = view !== 'settings';
  loginView.hidden = view !== 'login';
  appView.hidden = view !== 'app';
}

// --- Settings ---------------------------------------------------------

document.getElementById('settings-link').addEventListener('click', (event) => {
  event.preventDefault();
  document.getElementById('api-base-url').value = getApiBaseUrl();
  setView('settings');
});

document.getElementById('settings-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.getElementById('api-base-url');
  setApiBaseUrl(input.value.trim());
  bootstrap();
});

function updateCrossOriginWarning(baseUrl) {
  crossOriginWarning.hidden = !isCrossOrigin(baseUrl);
}

// --- Auth ---------------------------------------------------------

document.getElementById('sign-in-btn').addEventListener('click', () => redirectToSignIn(api.baseUrl));

signOutBtn.addEventListener('click', async () => {
  try {
    await signOut(api);
  } catch {
    // Session may already be gone; proceed to the login view regardless.
  }
  authStatus.textContent = '';
  signOutBtn.hidden = true;
  setView('login');
});

async function checkAuthAndRender() {
  try {
    const authenticated = await api.checkSession();
    if (authenticated) {
      authStatus.textContent = 'Signed in';
      signOutBtn.hidden = false;
      setView('app');
      await Promise.all([loadPosts(), loadStories()]);
    } else {
      setView('login');
    }
  } catch (err) {
    showBanner(err.message || 'Could not reach the CMS API', true);
    setView('login');
  }
}

// --- Tabs ---------------------------------------------------------

for (const tab of document.querySelectorAll('.moh-tab')) {
  tab.addEventListener('click', (event) => {
    event.preventDefault();
    for (const t of document.querySelectorAll('.moh-tab')) t.classList.remove('moh-tab-active');
    tab.classList.add('moh-tab-active');

    for (const panel of document.querySelectorAll('.moh-panel')) panel.hidden = true;
    document.getElementById(`${tab.dataset.tab}-tab`).hidden = false;
  });
}

// --- Posts ---------------------------------------------------------

const postDialog = document.getElementById('post-dialog');
const postForm = document.getElementById('post-form');

async function loadPosts() {
  const posts = await api.listPosts();
  renderPosts(document.getElementById('posts-list'), posts, {
    onEdit: (post) => openPostDialog(post),
    onDelete: (post) => deletePost(post),
  });
}

function openPostDialog(post) {
  document.getElementById('post-dialog-title').textContent = post ? 'Edit post' : 'New post';
  fillPostForm(postForm, post);
  postDialog.showModal();
}

document.getElementById('new-post-btn').addEventListener('click', () => openPostDialog(null));
document.getElementById('post-cancel-btn').addEventListener('click', () => postDialog.close());

postForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = postForm.elements.id.value;
  const payload = readPostForm(postForm);

  try {
    if (id) await api.updatePost(id, payload);
    else await api.createPost(payload);
    postDialog.close();
    showBanner('Post saved');
    await loadPosts();
  } catch (err) {
    showBanner(err.message || 'Could not save post', true);
  }
});

async function deletePost(post) {
  if (!confirm(`Delete post "${post.title}"?`)) return;
  try {
    await api.deletePost(post.id);
    showBanner('Post deleted');
    await loadPosts();
  } catch (err) {
    showBanner(err.message || 'Could not delete post', true);
  }
}

// --- Stories ---------------------------------------------------------

const storyDialog = document.getElementById('story-dialog');
const storyForm = document.getElementById('story-form');

async function loadStories() {
  const stories = await api.listStories();
  renderStories(document.getElementById('stories-list'), stories, {
    onEdit: (story) => openStoryDialog(story),
    onDelete: (story) => deleteStory(story),
  });
}

function openStoryDialog(story) {
  document.getElementById('story-dialog-title').textContent = story ? 'Edit story' : 'New story';
  fillStoryForm(storyForm, story);
  storyDialog.showModal();
}

document.getElementById('new-story-btn').addEventListener('click', () => openStoryDialog(null));
document.getElementById('story-cancel-btn').addEventListener('click', () => storyDialog.close());

storyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = storyForm.elements.id.value;
  const payload = readStoryForm(storyForm);

  try {
    if (id) await api.updateStory(id, payload);
    else await api.createStory(payload);
    storyDialog.close();
    showBanner('Story saved');
    await loadStories();
  } catch (err) {
    showBanner(err.message || 'Could not save story', true);
  }
});

async function deleteStory(story) {
  if (!confirm(`Delete story "${story.id}"?`)) return;
  try {
    await api.deleteStory(story.id);
    showBanner('Story deleted');
    await loadStories();
  } catch (err) {
    showBanner(err.message || 'Could not delete story', true);
  }
}

// --- Media ---------------------------------------------------------

const mediaResult = document.getElementById('media-result');
const copyPathBtn = document.getElementById('copy-path-btn');

document.getElementById('media-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const fileInput = document.getElementById('media-file');
  const kind = document.getElementById('media-kind').value;
  const file = fileInput.files[0];
  if (!file) return;

  try {
    await handleMediaUpload(api, file, kind, mediaResult);
    copyPathBtn.hidden = false;
  } catch {
    copyPathBtn.hidden = true;
  }
});

copyPathBtn.addEventListener('click', async () => {
  const copied = await copyToClipboard(mediaResult.dataset.path || '');
  showBanner(copied ? 'Path copied' : 'Copy not supported in this browser');
});

// --- Bootstrap ---------------------------------------------------------

async function bootstrap() {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    setView('settings');
    return;
  }

  document.getElementById('api-base-url').value = baseUrl;
  updateCrossOriginWarning(baseUrl);
  api = new ApiClient(baseUrl);

  if (isSignInRedirect()) {
    clearSignInRedirectParams();
    showBanner('Signed in');
  }

  await checkAuthAndRender();
}

bootstrap().catch((err) => {
  console.error(err);
  showBanner(err instanceof ApiError ? err.message : 'Unexpected error', true);
});

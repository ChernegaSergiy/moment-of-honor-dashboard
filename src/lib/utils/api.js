// Thin wrapper over the Moment of Honor CMS API (see the moment-of-honor-cms
// repository). Every call sends credentials so the Worker's signed session
// cookie is included; the CMS API itself decides what is public and what
// requires an authenticated author.

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async #request(path, options = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        ...(typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });

    if (response.status === 204) return null;

    let data = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const message = (data && data.error) || `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status);
    }

    return data;
  }

  // --- Posts ---------------------------------------------------------

  listPosts() {
    return this.#request('/api/posts');
  }

  createPost(payload) {
    return this.#request('/api/posts', { method: 'POST', body: JSON.stringify(payload) });
  }

  updatePost(id, payload) {
    return this.#request(`/api/posts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  deletePost(id) {
    return this.#request(`/api/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  // --- Stories ---------------------------------------------------------

  listStories() {
    return this.#request('/api/stories');
  }

  createStory(payload) {
    return this.#request('/api/stories', { method: 'POST', body: JSON.stringify(payload) });
  }

  updateStory(id, payload) {
    return this.#request(`/api/stories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  deleteStory(id) {
    return this.#request(`/api/stories/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  // --- Media ---------------------------------------------------------

  async uploadMedia(file, kind) {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);

    return this.#request('/api/media', { method: 'POST', body: form });
  }

  listMedia(kind) {
    const query = kind ? `?kind=${encodeURIComponent(kind)}` : '';
    return this.#request(`/api/media${query}`);
  }

  deleteMedia(path) {
    return this.#request('/api/media', {
      method: 'DELETE',
      body: JSON.stringify({ path }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // --- Auth ---------------------------------------------------------

  /** Resolves true if the current session can call the authenticated API. */
  async checkSession() {
    try {
      await this.listPosts();
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return false;
      throw err;
    }
  }

  async logout() {
    await this.#request('/auth/logout', { method: 'POST' });
  }
}

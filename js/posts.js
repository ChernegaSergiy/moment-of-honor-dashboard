import { el, clear, formatDateTime, localInputToIso, isoToLocalInput } from './dom.js';

/** Renders the posts list into `container`, wiring edit/delete actions. */
export function renderPosts(container, posts, { onEdit, onDelete }) {
  clear(container);

  if (posts.length === 0) {
    container.append(el('p', {}, 'No posts yet.'));
    return;
  }

  for (const post of posts) {
    const article = el('article', {}, [
      el('header', {}, [
        el('strong', {}, post.title),
        el('span', { class: 'moh-meta' }, ` — ${formatDateTime(post.publishedAt)}`),
      ]),
      el('p', {}, post.content.length > 240 ? `${post.content.slice(0, 240)}…` : post.content),
      post.media.length > 0
        ? el(
            'p',
            { class: 'moh-meta' },
            `Media: ${post.media.join(', ')}`,
          )
        : null,
      el('footer', {}, [
        el('button', { class: 'secondary', onClick: () => onEdit(post) }, 'Edit'),
        el('button', { class: 'contrast', onClick: () => onDelete(post) }, 'Delete'),
      ]),
    ]);

    container.append(article);
  }
}

/** Populates the post form fields from an existing post, or resets it for a new one. */
export function fillPostForm(form, post) {
  form.elements.id.value = post?.id ?? '';
  form.elements.title.value = post?.title ?? '';
  form.elements.content.value = post?.content ?? '';
  form.elements.media.value = post?.media?.join(', ') ?? '';
  form.elements.author.value = post?.author ?? '';
  form.elements.publishedAt.value = post ? isoToLocalInput(post.publishedAt) : isoToLocalInput(new Date().toISOString());
}

/** Reads the post form into an API payload. */
export function readPostForm(form) {
  const media = form.elements.media.value
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  return {
    title: form.elements.title.value.trim(),
    content: form.elements.content.value,
    media,
    author: form.elements.author.value.trim(),
    publishedAt: localInputToIso(form.elements.publishedAt.value),
  };
}

import { el, clear, formatDateTime, localInputToIso, isoToLocalInput } from './dom.js';

/** Renders the stories list into `container`, wiring edit/delete actions. */
export function renderStories(container, stories, { onEdit, onDelete }) {
  clear(container);

  if (stories.length === 0) {
    container.append(el('p', {}, 'No stories yet.'));
    return;
  }

  for (const story of stories) {
    const expired = new Date(story.expiresAt).getTime() <= Date.now();

    const article = el('article', {}, [
      el('header', {}, [
        el('strong', {}, story.id),
        expired ? el('span', { class: 'moh-badge' }, ' expired') : null,
      ]),
      el('p', { class: 'moh-meta' }, `Published: ${formatDateTime(story.publishedAt)}`),
      el('p', { class: 'moh-meta' }, `Expires: ${formatDateTime(story.expiresAt)}`),
      el('p', { class: 'moh-meta' }, `Media: ${story.media.join(', ')}`),
      el('footer', {}, [
        el('button', { class: 'secondary', onClick: () => onEdit(story) }, 'Edit'),
        el('button', { class: 'contrast', onClick: () => onDelete(story) }, 'Delete'),
      ]),
    ]);

    container.append(article);
  }
}

/** Populates the story form fields from an existing story, or resets it for a new one. */
export function fillStoryForm(form, story) {
  form.elements.id.value = story?.id ?? '';
  form.elements.media.value = story?.media?.join(', ') ?? '';
  form.elements.author.value = story?.author ?? '';

  const now = new Date();
  const inHours24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  form.elements.publishedAt.value = story ? isoToLocalInput(story.publishedAt) : isoToLocalInput(now.toISOString());
  form.elements.expiresAt.value = story ? isoToLocalInput(story.expiresAt) : isoToLocalInput(inHours24.toISOString());
}

/** Reads the story form into an API payload. */
export function readStoryForm(form) {
  const media = form.elements.media.value
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const author = form.elements.author.value.trim();

  return {
    media,
    author: author || undefined,
    publishedAt: localInputToIso(form.elements.publishedAt.value),
    expiresAt: localInputToIso(form.elements.expiresAt.value),
  };
}

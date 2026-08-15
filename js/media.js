// Uploads a file via the CMS API and surfaces the resulting repository path
// so it can be copied into a post's or story's `media` field.

export async function handleMediaUpload(api, file, kind, resultEl) {
  resultEl.textContent = 'Uploading…';
  resultEl.classList.remove('moh-error');

  try {
    const { path } = await api.uploadMedia(file, kind);
    resultEl.textContent = path;
    resultEl.dataset.path = path;
    return path;
  } catch (err) {
    resultEl.textContent = err.message || 'Upload failed';
    resultEl.classList.add('moh-error');
    throw err;
  }
}

export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}

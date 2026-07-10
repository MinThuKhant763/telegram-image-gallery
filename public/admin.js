const tokenForm = document.querySelector('#tokenForm');
const adminToken = document.querySelector('#adminToken');
const adminStatus = document.querySelector('#adminStatus');
const adminList = document.querySelector('#adminList');

adminToken.value = localStorage.getItem('galleryAdminToken') || '';

function setStatus(message, variant = '') {
  adminStatus.textContent = message;
  adminStatus.dataset.variant = variant;
}

function authHeaders() {
  return {
    Authorization: `Bearer ${adminToken.value.trim()}`,
    'Content-Type': 'application/json'
  };
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed with ${response.status}`);
  }

  return response.json();
}

async function saveImage(image, captionInput, statusSelect) {
  await request('/api/admin-images', {
    method: 'PATCH',
    body: JSON.stringify({
      id: image.id,
      caption: captionInput.value,
      status: statusSelect.value
    })
  });

  setStatus('Image updated.', 'ready');
  await loadImages();
}

async function deleteImage(image) {
  const ok = confirm('Delete this image permanently?');

  if (!ok) {
    return;
  }

  await request(`/api/admin-images?id=${encodeURIComponent(image.id)}`, {
    method: 'DELETE'
  });

  setStatus('Image deleted.', 'ready');
  await loadImages();
}

function renderImages(images) {
  adminList.replaceChildren();

  if (!images.length) {
    setStatus('No memories added yet.', 'empty');
    return;
  }

  setStatus(`${images.length} ${images.length === 1 ? 'memory' : 'memories'}`, 'ready');

  for (const image of images) {
    const row = document.createElement('article');
    row.className = 'admin-row';

    const img = document.createElement('img');
    img.src = image.image_url;
    img.alt = image.caption || 'Memory photo';
    img.loading = 'lazy';

    const fields = document.createElement('div');
    fields.className = 'admin-fields';

    const caption = document.createElement('input');
    caption.value = image.caption || '';
    caption.placeholder = 'Caption';

    const status = document.createElement('select');
    status.innerHTML = '<option value="published">Published</option><option value="hidden">Hidden</option>';
    status.value = image.status;

    const meta = document.createElement('p');
    meta.textContent = `${image.sender_name || 'Telegram'} · ${formatDate(image.created_at)}`;

    const actions = document.createElement('div');
    actions.className = 'admin-actions';

    const save = document.createElement('button');
    save.type = 'button';
    save.textContent = 'Save';
    save.addEventListener('click', () => saveImage(image, caption, status));

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Delete';
    remove.className = 'danger';
    remove.addEventListener('click', () => deleteImage(image));

    actions.append(save, remove);
    fields.append(caption, status, meta, actions);
    row.append(img, fields);
    adminList.append(row);
  }
}

async function loadImages() {
  try {
    localStorage.setItem('galleryAdminToken', adminToken.value.trim());
    setStatus('Loading images...');
    const { images } = await request('/api/admin-images');
    renderImages(images);
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

tokenForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadImages();
});

if (adminToken.value) {
  loadImages();
}

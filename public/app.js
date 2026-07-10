const gallery = document.querySelector('#gallery');
const status = document.querySelector('#status');
const refreshButton = document.querySelector('#refreshButton');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightboxImage');
const lightboxCaption = document.querySelector('#lightboxCaption');
const lightboxDetails = document.querySelector('#lightboxDetails');
const closeLightbox = document.querySelector('#closeLightbox');
const deleteImageButton = document.querySelector('#deleteImageButton');

let lastImageSignature = '';
let selectedImage = null;

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function setStatus(message, variant = '') {
  status.textContent = message;
  status.dataset.variant = variant;
}

function openPreview(image) {
  selectedImage = image;
  lightboxImage.src = image.image_url;
  lightboxImage.alt = image.caption || 'Memory photo';
  lightboxCaption.textContent = image.caption || 'Untitled memory';
  lightboxDetails.textContent = `${image.sender_name || 'Telegram'} · ${formatDate(image.created_at)}`;
  deleteImageButton.hidden = !localStorage.getItem('galleryAdminToken');
  lightbox.showModal();
}

async function deleteSelectedImage() {
  const adminToken = localStorage.getItem('galleryAdminToken');

  if (!selectedImage || !adminToken) {
    return;
  }

  const confirmed = confirm('Delete this image permanently?');

  if (!confirmed) {
    return;
  }

  deleteImageButton.disabled = true;

  try {
    const response = await fetch(`/api/admin-images?id=${encodeURIComponent(selectedImage.id)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Delete failed with ${response.status}`);
    }

    lightbox.close();
    selectedImage = null;
    lastImageSignature = '';
    await loadGallery();
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    deleteImageButton.disabled = false;
  }
}

function renderImages(images) {
  gallery.replaceChildren();

  if (!images.length) {
    setStatus('No memories yet. Send a photo to your Telegram bot to add the first one.', 'empty');
    return;
  }

  setStatus(`${images.length} ${images.length === 1 ? 'memory' : 'memories'}`, 'ready');

  for (const image of images) {
    const item = document.createElement('button');
    item.className = 'gallery-item';
    item.type = 'button';
    item.setAttribute('aria-label', image.caption || 'Open image preview');
    item.addEventListener('click', () => openPreview(image));

    const img = document.createElement('img');
    img.src = image.image_url;
    img.alt = image.caption || 'Memory photo';
    img.loading = 'lazy';

    const meta = document.createElement('span');
    meta.className = 'item-meta';
    meta.textContent = image.caption || formatDate(image.created_at);

    item.append(img, meta);
    gallery.append(item);
  }
}

async function loadGallery({ quiet = false } = {}) {
  if (!quiet) {
    setStatus('Loading memories...');
  }

  try {
    const response = await fetch('/api/gallery');

    if (!response.ok) {
      throw new Error(`Gallery request failed with ${response.status}`);
    }

    const { images } = await response.json();
    const signature = images.map((image) => image.id).join(',');

    if (signature !== lastImageSignature) {
      lastImageSignature = signature;
      renderImages(images);
    } else if (!quiet) {
      setStatus(`${images.length} ${images.length === 1 ? 'memory' : 'memories'}`, 'ready');
    }
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

refreshButton.addEventListener('click', () => loadGallery());
closeLightbox.addEventListener('click', () => lightbox.close());
deleteImageButton.addEventListener('click', deleteSelectedImage);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) {
    lightbox.close();
  }
});

loadGallery();
setInterval(() => loadGallery({ quiet: true }), 15000);

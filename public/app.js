const gallery = document.querySelector('#gallery');
const status = document.querySelector('#status');
const refreshButton = document.querySelector('#refreshButton');
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightboxImage');
const lightboxCaption = document.querySelector('#lightboxCaption');
const lightboxDetails = document.querySelector('#lightboxDetails');
const closeLightbox = document.querySelector('#closeLightbox');

let lastImageSignature = '';

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
  lightboxImage.src = image.image_url;
  lightboxImage.alt = image.caption || 'Gallery image';
  lightboxCaption.textContent = image.caption || 'Untitled photo';
  lightboxDetails.textContent = `${image.sender_name || 'Telegram'} · ${formatDate(image.created_at)}`;
  lightbox.showModal();
}

function renderImages(images) {
  gallery.replaceChildren();

  if (!images.length) {
    setStatus('No photos yet. Send a photo to your Telegram bot to publish the first one.', 'empty');
    return;
  }

  setStatus(`${images.length} published ${images.length === 1 ? 'photo' : 'photos'}`, 'ready');

  for (const image of images) {
    const item = document.createElement('button');
    item.className = 'gallery-item';
    item.type = 'button';
    item.setAttribute('aria-label', image.caption || 'Open image preview');
    item.addEventListener('click', () => openPreview(image));

    const img = document.createElement('img');
    img.src = image.image_url;
    img.alt = image.caption || 'Gallery image';
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
    setStatus('Loading gallery...');
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
      setStatus(`${images.length} published ${images.length === 1 ? 'photo' : 'photos'}`, 'ready');
    }
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

refreshButton.addEventListener('click', () => loadGallery());
closeLightbox.addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) {
    lightbox.close();
  }
});

loadGallery();
setInterval(() => loadGallery({ quiet: true }), 15000);

/**
 * Photos component — photo gallery using BaguetteBox.js for lightbox.
 */
import { bus } from '../pubsub.js';

export function createPhotosWindow(wm, photos) {
  function renderGallery() {
    if (!photos || photos.length === 0) {
      return `<div class="empty-state"><div class="icon">📷</div><div>No photos yet.</div><div style="font-size:10px;margin-top:4px">Add photos to content/photos/ and update manifest.json</div></div>`;
    }

    return `<div class="photo-grid">
      ${photos.map((p, i) => `
        <a href="${p.src}" class="photo-thumb" data-caption="${p.caption || ''}" aria-label="Photo: ${p.caption || 'Untitled'}">
          <img src="${p.thumb || p.src}" alt="${p.caption || 'Photo'}" loading="lazy">
          ${p.caption ? `<div class="caption">${p.caption}</div>` : ''}
        </a>
      `).join('')}
    </div>`;
  }

  const body = document.createElement('div');
  body.innerHTML = renderGallery();

  wm.open({
    id: 'photos',
    title: '📷 My Photos',
    content: body,
    width: 640,
    height: 480,
    icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect fill=%22%234caf50%22 width=%2232%22 height=%2232%22 rx=%224%22/%3E%3C/svg%3E',
  });

  // Init BaguetteBox after window is in DOM
  setTimeout(() => {
    const gallery = body.querySelector('.photo-grid');
    if (gallery && gallery.children.length > 0 && typeof baguetteBox !== 'undefined') {
      baguetteBox.run('.photo-grid', {
        captions: (el) => el.dataset.caption || '',
        animation: 'slideIn',
      });
    }
  }, 100);
}

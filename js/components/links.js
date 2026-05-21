/**
 * Links component — renders curated links list.
 */
import { bus } from '../pubsub.js';

export function createLinksWindow(wm, links) {
  function renderLinks() {
    if (!links || links.length === 0) {
      return `<div class="empty-state"><div class="icon">🔗</div><div>No links yet.</div><div style="font-size:10px;margin-top:4px">Edit content/links.json to add links</div></div>`;
    }

    return `<div class="links-list">
      ${links.map(l => `
        <a href="${l.url}" class="link-item" target="_blank" rel="noopener" tabindex="0">
          <span>🔗</span>
          <span class="link-title">${l.title}</span>
          <span class="link-url">${l.url}</span>
        </a>
      `).join('')}
    </div>`;
  }

  const body = document.createElement('div');
  body.innerHTML = renderLinks();

  wm.open({
    id: 'links',
    title: '🔗 My Links',
    content: body,
    width: 480,
    height: 350,
    icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect fill=%22%232196f3%22 width=%2232%22 height=%2232%22 rx=%224%22/%3E%3C/svg%3E',
  });
}

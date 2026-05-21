/**
 * Notes component — renders the notes list and viewer.
 * Reads from content/notes/ directory at build time via notes manifest.
 */
import { bus } from '../pubsub.js';

export function createNotesWindow(wm, notes) {
  let currentNote = null;

  function renderList() {
    return notes.map(n => `
      <div class="note-item" data-note="${n.id}" tabindex="0" role="button" aria-label="Open note: ${n.title}">
        <span>📄</span>
        <div>
          <div>${n.title}</div>
          <div class="note-meta">${n.date || ''}</div>
        </div>
      </div>
    `).join('');
  }

  function renderNote(note) {
    currentNote = note;
    const body = wm.getWindow('notes')?.querySelector('.window-body');
    if (!body) return;

    // Simple markdown-to-HTML converter (handles basics)
    let html = note.content
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    html = '<p>' + html + '</p>';

    body.innerHTML = `
      <button class="back-btn" style="margin-bottom:8px;font-size:11px;">← Back to Notes</button>
      <div class="note-content">${html}</div>
    `;

    body.querySelector('.back-btn').addEventListener('click', () => {
      currentNote = null;
      const b = wm.getWindow('notes')?.querySelector('.window-body');
      if (!b) return;
      b.innerHTML = `<div class="notes-list">${renderList()}</div>`;
      attachListHandlers(b);
    });
  }

  function attachListHandlers(body) {
    body.querySelectorAll('.note-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.note;
        const note = notes.find(n => n.id === id);
        if (note) renderNote(note);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const id = el.dataset.note;
          const note = notes.find(n => n.id === id);
          if (note) renderNote(note);
        }
      });
    });
  }

  const body = document.createElement('div');
  body.innerHTML = notes.length
    ? `<div class="notes-list">${renderList()}</div>`
    : `<div class="empty-state"><div class="icon">📝</div><div>No notes yet.</div><div style="font-size:10px;margin-top:4px">Add .md files to content/notes/</div></div>`;

  attachListHandlers(body);

  wm.open({
    id: 'notes',
    title: '📝 My Notes',
    content: body,
    width: 500,
    height: 400,
    icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect fill=%22%23ffb900%22 width=%2232%22 height=%2232%22/%3E%3C/svg%3E',
  });
}

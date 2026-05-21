/**
 * samuelphan.com — Main entry point
 * Initializes all components: window manager, desktop, taskbar, start menu.
 * Handles app routing (which component to open when user clicks an icon).
 */
import { bus } from './pubsub.js';
import { createWindowManager } from './window-manager.js';
import { initDesktop } from './components/desktop.js';
import { initTaskbar } from './components/taskbar.js';
import { initStartMenu } from './components/start-menu.js';
import { createNotesWindow } from './components/notes.js';
import { createPhotosWindow } from './components/photos.js';
import { createMinesweeperWindow } from './components/minesweeper.js';
import { createCmdWindow } from './components/cmd.js';
import { createLinksWindow } from './components/links.js';

// Expose window manager globally for component access
const wm = createWindowManager();

// Content data — loaded from embedded JSON in index.html
let contentData = {
  notes: [],
  photos: [],
  links: [],
};

// Desktop icons
const desktopIcons = [
  { id: 'notes', title: 'My Notes', icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect fill=%22%23ffb900%22 width=%2232%22 height=%2232%22 rx=%224%22/%3E%3Ctext fill=%22white%22 x=%2216%22 y=%2222%22 text-anchor=%22middle%22 font-size=%2216%22%3E📝%3C/text%3E%3C/svg%3E' },
  { id: 'photos', title: 'My Photos', icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect fill=%22%234caf50%22 width=%2232%22 height=%2232%22 rx=%224%22/%3E%3Ctext fill=%22white%22 x=%2216%22 y=%2222%22 text-anchor=%22middle%22 font-size=%2216%22%3E📷%3C/text%3E%3C/svg%3E' },
  { id: 'links', title: 'My Links', icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect fill=%22%232196f3%22 width=%2232%22 height=%2232%22 rx=%224%22/%3E%3Ctext fill=%22white%22 x=%2216%22 y=%2222%22 text-anchor=%22middle%22 font-size=%2216%22%3E🔗%3C/text%3E%3C/svg%3E' },
  { id: 'minesweeper', title: 'Minesweeper', icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect fill=%22%23ff5722%22 width=%2232%22 height=%2232%22 rx=%224%22/%3E%3Ctext fill=%22white%22 x=%2216%22 y=%2222%22 text-anchor=%22middle%22 font-size=%2216%22%3E💣%3C/text%3E%3C/svg%3E' },
  { id: 'cmd', title: 'CMD Prompt', icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect fill=%22%23000%22 width=%2232%22 height=%2232%22 rx=%224%22/%3E%3Ctext fill=%22%2300ff00%22 x=%2216%22 y=%2222%22 text-anchor=%22middle%22 font-size=%2216%22%3E&gt;_%3C/text%3E%3C/svg%3E' },
];

// Start menu sections
const startMenuItems = [
  {
    heading: 'Content',
    items: [
      { label: '📝 My Notes', app: 'notes', icon: '' },
      { label: '📷 My Photos', app: 'photos', icon: '' },
      { label: '🔗 My Links', app: 'links', icon: '' },
    ],
  },
  {
    heading: 'Fun',
    items: [
      { label: '💣 Minesweeper', app: 'minesweeper', icon: '' },
      { label: '💻 Command Prompt', app: 'cmd', icon: '' },
    ],
  },
];

// App launcher: maps app IDs to components that open in windows
function launchApp(appId) {
  switch (appId) {
    case 'notes':
      createNotesWindow(wm, contentData.notes);
      break;
    case 'photos':
      createPhotosWindow(wm, contentData.photos);
      break;
    case 'links':
      createLinksWindow(wm, contentData.links);
      break;
    case 'minesweeper':
      createMinesweeperWindow(wm);
      break;
    case 'cmd':
      createCmdWindow(wm);
      break;
    default:
      console.warn(`Unknown app: ${appId}`);
  }
}

// Handle window close from CMD exit command
bus.on('window:close', (id) => {
  wm.close(id);
});

// Handle window restore from taskbar
bus.on('window:restore-request', (id) => {
  const win = wm.getWindow(id);
  if (!win) {
    // Window doesn't exist — relaunch the app
    launchApp(id);
    return;
  }
  if (win.style.display === 'none') {
    wm.restore(id);
  }
});

// Listen for app launches
bus.on('app:launch', launchApp);

// Initialize when DOM is ready
function init() {
  // Try to load content data from embedded script
  const dataEl = document.getElementById('content-data');
  if (dataEl) {
    try {
      contentData = JSON.parse(dataEl.textContent);
    } catch (e) {
      console.warn('Failed to parse content data:', e);
    }
  }

  initDesktop(desktopIcons);
  initTaskbar();
  initStartMenu(startMenuItems);

  console.log('samuelphan.com — Windows XP themed personal site ready!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

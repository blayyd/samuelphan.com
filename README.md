# samuelphan.com

A personal website themed as a **Windows XP desktop** — complete with draggable windows, a Start menu, taskbar, Minesweeper, and a working Command Prompt.

Built with vanilla HTML, CSS, and JavaScript — **no frameworks, no build steps, no dependencies to install.**

## Tech Stack

| Component | Choice |
|---|---|
| Theme | [XP.css](https://botoxparty.github.io/XP.css/) v0.2.6 — CSS-only Windows XP Luna theme |
| Photo Gallery | [BaguetteBox.js](https://feimosi.github.io/baguetteBox.js/) v1.12.0 — lightbox gallery |
| Window Manager | Custom vanilla JS (~400 lines) — draggable, resizable, minimizable windows |
| Architecture | Event-driven pub/sub — decoupled component communication |
| Hosting | GitHub Pages (free, zero-config) |
| CI/CD | GitHub Actions — auto-deploys on push to `main` |

## Project Structure

```
samuelphan.com/
├── index.html              # Main entry — desktop shell and embedded content
├── css/
│   └── style.css           # Custom styles: desktop, taskbar, start menu, mobile
├── js/
│   ├── main.js             # Entry point — bootstraps all components
│   ├── pubsub.js           # Event bus for decoupled communication
│   ├── window-manager.js   # Draggable/resizable window system
│   └── components/
│       ├── desktop.js      # Desktop icons and double-click handling
│       ├── taskbar.js      # Taskbar with clock and window buttons
│       ├── start-menu.js   # Classic XP Start menu
│       ├── notes.js        # Notes list and markdown viewer
│       ├── photos.js       # Photo gallery with BaguetteBox lightbox
│       ├── links.js        # Curated links list
│       ├── minesweeper.js  # Full Minesweeper game (9×9, 10 mines)
│       └── cmd.js          # Fake Command Prompt with interactive commands
├── lib/
│   ├── xp.css/XP.css       # XP.css framework (vendored)
│   └── baguettebox.js/     # BaguetteBox.js (vendored)
├── content/
│   ├── notes/              # Markdown note files (drop-in)
│   └── photos/             # Photo files + manifest.json
├── assets/images/          # Static image assets
├── .github/workflows/
│   └── deploy.yml          # GitHub Pages deployment workflow
└── .gitignore
```

## Running Locally

No build step, no npm install, no bundler. Just serve the directory:

```bash
# Python (built-in)
python3 -m http.server 8080

# Node (if you have npx)
npx serve .

# Or open index.html directly — works in most browsers
xdg-open index.html
```

Then visit `http://localhost:8080`.

## Adding Content

### Notes
Add entries to the `notes` array in the `<script id="content-data">` tag in `index.html`:

```json
{
  "id": "my-note",
  "title": "My Note Title",
  "date": "2026-06-01",
  "content": "# My Note\n\nMarkdown content here..."
}
```

### Photos
1. Add image files to `content/photos/`
2. Add entries to `content/photos/manifest.json`

### Links
Add entries to the `links` array in the `#content-data` script tag.

## Deployment

Push to `main`. GitHub Actions builds and deploys to GitHub Pages automatically. No configuration needed — just make sure GitHub Pages is set to "Deploy from Actions" in your repo settings.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile fallback for screens under 768px
- WCAG 2.1 Level A accessibility baseline

## License

MIT

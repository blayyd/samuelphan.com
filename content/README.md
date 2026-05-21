# Content Pipeline

This directory holds the source content for samuelphan.com. Drop your
Obsidian notes and photos here, run the build, and they appear on the site.

## How it works

```
content/notes/*.md   ──→  build.py  ──→  data/notes.json   ──→  Notepad app
content/photos/*.svg ──→  build.py  ──→  assets/photos.json ──→  Picture Viewer
```

The build script (`build.py` in the repo root) reads your markdown files
and images, copies them to the right places, and generates the JSON
manifests that the XP desktop apps load.

## Adding a note

1. Write a markdown file in **content/notes/**.
2. Include YAML frontmatter for metadata:

```markdown
---
title: "My Note Title"
date: 2026-05-21
tags:
  - personal
  - ideas
---

Your note content here. Markdown formatting is preserved.
```

- **title** — display name in the Notepad Open dialog
- **date** — (optional) creation or publish date
- **tags** — (optional) tags for future filtering features

3. Run `make build` (or `python3 build.py`) from the repo root.

Your note shows up in the Notepad app's Open dialog instantly.

## Adding a photo

1. Drop an image file into **content/photos/**.
   Supported formats: `.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp`

2. (Optional) Create a sidecar file with the same name for a description:
   - `sunset-mountains.txt` alongside `sunset-mountains.svg`
   - Max one line of text — it becomes the description in Picture Viewer

3. Run `make build`.

The image is copied to `assets/` and listed in the Picture Viewer gallery.

## Build commands

| Command | What it does |
|---------|-------------|
| `make build` | Build both notes and photos |
| `make notes` | Build notes manifest only |
| `make photos` | Build photos manifest only |
| `make clean` | Remove generated output files |

## Directory structure

```
content/
├── notes/         ← Drop your .md files here
├── photos/        ← Drop your images here
├── generated/     ← Intermediate build artifacts (if any)
└── README.md      ← This file
```

## Tips

- Filenames become note IDs — use descriptive kebab-case names like
  `my-travel-journal.md` rather than spaces or special characters.
- The title in the frontmatter is what shows up in the Notepad Open dialog.
  If you omit it, the filename is used (with hyphens converted to spaces).
- Images are copied into `assets/` during build. Original files in
  `content/photos/` are never modified.
- The build is idempotent — run it as many times as you want. Only
  changed content gets regenerated.

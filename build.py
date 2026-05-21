#!/usr/bin/env python3
"""
Content pipeline for samuelphan.com

Converts Obsidian-style markdown notes and photo directories into
JSON data files consumed by the XP desktop Notepad and Picture Viewer apps.

Usage:
    python3 build.py          # build everything
    python3 build.py notes    # build notes manifest only
    python3 build.py photos   # build photos manifest only
"""

import json
import os
import re
import sys
import shutil
from datetime import datetime
from pathlib import Path

# ── paths relative to repo root ──────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent
NOTES_DIR      = ROOT / "content" / "notes"
PHOTOS_DIR     = ROOT / "content" / "photos"
GENERATED_DIR  = ROOT / "content" / "generated"
OUT_NOTES_JSON = ROOT / "data" / "notes.json"
OUT_PHOTOS_JSON = ROOT / "assets" / "photos.json"
ASSETS_DIR     = ROOT / "assets"

# image extensions the photo scanner recognises
IMG_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".bmp"}


# ═══════════════════════════════════════════════════════════════════════════════
#  Notes pipeline
# ═══════════════════════════════════════════════════════════════════════════════

def build_notes():
    """Scan content/notes/ for .md files, parse frontmatter, write data/notes.json."""
    NOTES_DIR.mkdir(parents=True, exist_ok=True)

    notes = {}
    md_files = sorted(NOTES_DIR.glob("*.md"))

    for md_path in md_files:
        raw = md_path.read_text(encoding="utf-8")
        frontmatter, body = parse_frontmatter(raw)

        slug = md_path.stem  # filename without .md
        key  = slug + ".txt"  # notepad.js looks up by .txt key

        title = frontmatter.get("title", humanize_slug(slug))
        tags  = frontmatter.get("tags", [])
        date  = frontmatter.get("date", "")

        notes[key] = {
            "title":   title,
            "content": body.strip(),
            "tags":    tags if isinstance(tags, list) else [tags],
            "date":    str(date) if date else "",
        }

    # ensure output dir
    OUT_NOTES_JSON.parent.mkdir(parents=True, exist_ok=True)

    OUT_NOTES_JSON.write_text(
        json.dumps(notes, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"[notes]  {len(notes)} notes written → {OUT_NOTES_JSON}")
    return notes


def parse_frontmatter(text: str):
    """Extract YAML-ish frontmatter and body from a markdown string.

    Expects a leading ``---`` block with key: value pairs.
    Falls back gracefully if no frontmatter is present.
    """
    fm = {}
    body = text

    # strip leading blank lines
    text = text.lstrip("\n")

    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            fm_block = parts[1].strip()
            body = parts[2].strip()

            for line in fm_block.splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue

                m = re.match(r"^(\w[\w-]*)\s*:\s*(.*)", line)
                if m:
                    key = m.group(1).strip()
                    val = m.group(2).strip()

                    # unwrap quoted values
                    if (val.startswith('"') and val.endswith('"')) or \
                       (val.startswith("'") and val.endswith("'")):
                        val = val[1:-1]

                    # list detection (YAML flow: [a, b, c])
                    if val.startswith("[") and val.endswith("]"):
                        val = [v.strip().strip("'\"") for v in val[1:-1].split(",") if v.strip()]

                    # bullet-list tags (Obsidian)
                    if key == "tags" and isinstance(val, str) and "," not in val:
                        # single tag entry on one line; multi-line handled below
                        pass

                    fm[key] = val

            # Handle multi-line tag lists (bare items indented under `tags:`)
            # After the first pass, also look for YAML-style list after `tags:`
            fm_lines = fm_block.splitlines()
            in_tags = False
            collected_tags = []
            for line in fm_lines:
                stripped = line.strip()
                if re.match(r"^tags\s*:", stripped):
                    in_tags = True
                    # check for inline value
                    val = re.sub(r"^tags\s*:\s*", "", stripped).strip()
                    if val:
                        if val.startswith("[") and val.endswith("]"):
                            collected_tags = [v.strip().strip("'\"") for v in val[1:-1].split(",") if v.strip()]
                        else:
                            collected_tags = [val.strip().strip("'\"")]
                    in_tags = bool(not val)  # keep True only if no inline value
                    continue
                if in_tags:
                    m2 = re.match(r"^\s*-\s+(.+)", stripped)
                    if m2:
                        collected_tags.append(m2.group(1).strip().strip("'\""))
                    elif stripped == "":
                        continue
                    else:
                        in_tags = False
            if collected_tags:
                fm["tags"] = collected_tags

    return fm, body


def humanize_slug(slug: str) -> str:
    """Turn 'my-cool-note' into 'My Cool Note'."""
    return re.sub(r"[-_]+", " ", slug).strip().title()


# ═══════════════════════════════════════════════════════════════════════════════
#  Photos pipeline
# ═══════════════════════════════════════════════════════════════════════════════

def build_photos():
    """Scan content/photos/ for images, copy to assets/, write assets/photos.json."""
    PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    photos = []
    seen = set()

    for ext in sorted(IMG_EXTENSIONS):
        for img_path in sorted(PHOTOS_DIR.glob(f"*{ext}")):
            stem = img_path.stem
            if stem in seen:
                continue
            seen.add(stem)

            # Derive title from filename
            title = humanize_slug(stem)

            # Try to load a sidecar description file
            description = ""
            for sidecar_ext in (".txt", ".desc"):
                sidecar = PHOTOS_DIR / (stem + sidecar_ext)
                if sidecar.exists():
                    description = sidecar.read_text(encoding="utf-8").strip()
                    break

            # Copy image into assets/ (overwrite)
            dest = ASSETS_DIR / img_path.name
            shutil.copy2(img_path, dest)

            photos.append({
                "filename":    img_path.name,
                "title":       title,
                "description": description,
            })

    OUT_PHOTOS_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_PHOTOS_JSON.write_text(
        json.dumps({"photos": photos}, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"[photos] {len(photos)} photos written → {OUT_PHOTOS_JSON}")
    return photos


# ═══════════════════════════════════════════════════════════════════════════════
#  Main
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "all"

    if target in ("all", "notes"):
        build_notes()
    if target in ("all", "photos"):
        build_photos()

    print("\n✓ Build complete.")


if __name__ == "__main__":
    main()

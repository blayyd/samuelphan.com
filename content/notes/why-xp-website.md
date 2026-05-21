---
title: "Why I Built a Windows XP Website in 2026"
date: 2026-05-10
tags:
  - web
  - nostalgia
  - project
---

Why I Built a Windows XP Website in 2026
=========================================

There's something about the early 2000s web that we lost.

The internet of 2001 was slower, clunkier, and far less capable —
but it was also more personal. People built pages by hand. They
experimented with garish color schemes, Comic Sans, and moving
GIFs because that's all there was. Every site was someone's
living room on the web.

Fast forward to 2026. The modern web is polished to a mirror
shine — React components, design systems, CDN edge caching.
But somehow, every site looks the same. The personality has
been sanded off.

This project — samuelphan.com — is my attempt to bottle some
of that old energy and serve it through a browser window.

A love letter to Windows XP
----------------------------

I chose Windows XP as the theme because it was the first OS
where I really understood what a computer could do. The Bliss
wallpaper. The startup sound. The Fisher-Price aesthetic that
somehow didn't feel childish — it felt welcoming.

The Luna theme, with its rounded corners and gradient title
bars, was a masterpiece of early 2000s design. It said:
"Computers are for everyone."

What I'm building
------------------

This site is a working XP desktop in the browser:
- A window manager (drag, resize, minimize, maximize)
- A taskbar with a real-time clock
- A Start menu with flyout submenus
- Classic XP apps: Notepad, Picture Viewer, Minesweeper,
  Command Prompt, Internet Explorer, and Clippy

No frameworks. No React. No Next.js. Just HTML, CSS, and
vanilla JavaScript — the way Tim Berners-Lee intended.

How to use this content pipeline
---------------------------------

I use Obsidian for my personal notes. The content pipeline
lets me drop markdown files from my vault into content/notes/,
run `make build` or `python3 build.py`, and they appear in
the Notepad app on the site.

Same for photos: drop an image into content/photos/, run the
build, and it shows up in Picture Viewer.

This keeps my content workflow simple: write in Obsidian,
sync to the site with one command. No CMS, no database,
no build pipeline that requires a CS degree to operate.

Just text files and a script.

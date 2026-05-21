/**
 * CMD component — fake Windows XP command prompt.
 * Provides a set of fun commands that reveal site content.
 */
import { bus } from '../pubsub.js';

// Command registry
const commands = {
  help: () => `
Available commands:
  HELP      Show this help
  DIR       List site sections
  NOTES     Show my notes
  PHOTOS    Open photo gallery
  LINKS     Show my links
  ABOUT     About Sam
  CLS       Clear screen
  TIME      Show current time
  DATE      Show current date
  VER       Show site version
  MINES     Open Minesweeper
  EXIT      Close this window
`,
  dir: () => `
 Volume in drive C has no label.
 Volume Serial Number is 5P4M-1337

 Directory of C:\\samuelphan.com

05/21/2026  09:00 AM    <DIR>          notes
05/21/2026  09:00 AM    <DIR>          photos
05/21/2026  09:00 AM    <DIR>          links
               0 File(s)              0 bytes
               3 Dir(s)   1,073,741,824 bytes free
`,
  about: () => `
Sam Phan — personal site

A Windows XP-themed corner of the web.
Built with vanilla HTML, CSS, and JavaScript.
No frameworks, no build steps, just vibes.

XP.css for the theme, BaguetteBox for photo gallery.
`,
  ver: () => `
samuelphan.com [Version 1.0.0]
(c) Sam Phan. All rights reserved.
`,
  time: () => new Date().toLocaleTimeString(),
  date: () => new Date().toDateString(),
  notes: () => { bus.emit('app:launch', 'notes'); return 'Opening Notes...'; },
  photos: () => { bus.emit('app:launch', 'photos'); return 'Opening Photos...'; },
  links: () => { bus.emit('app:launch', 'links'); return 'Opening Links...'; },
  mines: () => { bus.emit('app:launch', 'minesweeper'); return 'Opening Minesweeper...'; },
  cls: () => '__CLEAR__',
  exit: () => { bus.emit('window:close', 'cmd'); return ''; },
};

export function createCmdWindow(wm) {
  const content = document.createElement('div');
  content.className = 'cmd-body';

  const output = document.createElement('div');
  output.className = 'cmd-output';
  output.innerHTML = `Microsoft Windows XP [Version 5.1.2600]
(C) Copyright 1985-2001 Microsoft Corp.

C:\\samuelphan.com&gt;<span class="cmd-prompt"> </span>
`;

  const inputLine = document.createElement('div');
  inputLine.className = 'cmd-input-line';
  inputLine.innerHTML = `<span class="cmd-prompt">C:\\samuelphan.com&gt;</span>`;
  const input = document.createElement('input');
  input.className = 'cmd-input';
  input.setAttribute('aria-label', 'Command input');
  inputLine.appendChild(input);

  content.appendChild(output);
  content.appendChild(inputLine);

  function execute(cmd) {
    const cmdLower = cmd.trim().toLowerCase();
    const handler = commands[cmdLower];

    let result;
    if (handler) {
      result = handler();
    } else {
      result = `'${cmd.trim()}' is not recognized as an internal or external command,\noperable program or batch file.`;
    }

    if (result === '__CLEAR__') {
      output.innerHTML = '';
    } else {
      output.innerHTML += `<span class="cmd-prompt">C:\\samuelphan.com&gt;</span> ${cmd}\n${result}\n\n`;
    }

    // Scroll to bottom
    output.scrollTop = output.scrollHeight;
    input.value = '';
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = input.value;
      if (cmd.trim()) execute(cmd);
      else {
        output.innerHTML += `<span class="cmd-prompt">C:\\samuelphan.com&gt;</span>\n`;
        output.scrollTop = output.scrollHeight;
      }
    }
  });

  wm.open({
    id: 'cmd',
    title: '💻 Command Prompt',
    content,
    width: 560,
    height: 350,
    icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect fill=%22%23000%22 width=%2232%22 height=%2232%22 rx=%224%22/%3E%3C/svg%3E',
  });

  // Focus input after window opens
  setTimeout(() => input.focus(), 100);
}

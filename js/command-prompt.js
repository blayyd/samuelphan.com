/**
 * Command Prompt for XP Desktop
 *
 * Fake cmd.exe with:
 * - Black background, white monospace text
 * - C:\> prompt
 * - Commands: dir, help, about, links, cls, date, time, echo, ver, credits, exit
 * - Blinking cursor
 * - Command history (up/down arrow)
 */
(function () {
  'use strict';

  var wrapperEl = null;
  var outputEl = null;
  var inputLine = null;
  var currentInput = '';
  var cursorVisible = true;
  var cursorInterval = null;
  var commandHistory = [];
  var historyIndex = -1;
  var username = 'samuelphan';
  var computername = 'SAMUELXP';
  var currentDir = 'C:\\Documents and Settings\\' + username;

  var commands = {
    help: helpCmd,
    dir: dirCmd,
    about: aboutCmd,
    links: linksCmd,
    cls: clsCmd,
    date: dateCmd,
    time: timeCmd,
    echo: echoCmd,
    ver: verCmd,
    credits: creditsCmd,
    exit: exitCmd,
    type: typeCmd,
    cd: cdCmd,
    'set': setCmd
  };

  var files = {
    'projects': {
      type: 'DIR',
      size: '',
      date: getDateStr()
    },
    'about.txt': {
      type: 'FILE',
      size: '1,024',
      date: getDateStr()
    },
    'links.txt': {
      type: 'FILE',
      size: '512',
      date: getDateStr()
    },
    'hello.txt': {
      type: 'FILE',
      size: '24',
      date: getDateStr()
    },
    '.' : { type: 'DIR' },
    '..' : { type: 'DIR' }
  };

  var dirFiles = ['projects', 'about.txt', 'links.txt', 'hello.txt'];

  function getDateStr() {
    var d = new Date();
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + pad2(d.getDate()) + ' ' + d.getFullYear();
  }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function buildWrapper() {
    wrapperEl = document.createElement('div');
    wrapperEl.className = 'cmd-wrapper';
    wrapperEl.tabIndex = 0;

    outputEl = document.createElement('div');
    outputEl.className = 'cmd-output';
    wrapperEl.appendChild(outputEl);

    // Boot message
    addOutput('<span class="cmd-gray">Microsoft(R) Windows XP</span>');
    addOutput('<span class="cmd-gray">(C) Copyright 1985-2001 Microsoft Corp.</span>');
    addOutput('<span class="cmd-gray">' + 'C:\\>'.replace('>', '&gt;') + '</span>');
    addOutput('');

    // Input line
    inputLine = document.createElement('div');
    inputLine.className = 'cmd-line';
    wrapperEl.appendChild(inputLine);

    drawPrompt();

    // Keyboard handling
    wrapperEl.addEventListener('keydown', handleKeyDown);

    // Click to focus
    wrapperEl.addEventListener('click', function () {
      wrapperEl.focus();
    });

    // Cursor blink
    cursorInterval = setInterval(function () {
      var cursor = wrapperEl.querySelector('.cmd-cursor');
      if (cursor) {
        cursor.style.display = cursorVisible ? 'inline-block' : 'none';
        cursorVisible = !cursorVisible;
      }
    }, 500);

    return wrapperEl;
  }

  function drawPrompt() {
    if (!inputLine) return;
    var displayText = currentInput || '';
    inputLine.innerHTML = '<span class="cmd-prompt">' + currentDir.replace(/\\/g, '\\\\') + '&gt;</span>' +
      escapeHtml(displayText) + '<span class="cmd-cursor"></span>';
    wrapperEl.scrollTop = wrapperEl.scrollHeight;
  }

  function addOutput(html) {
    var line = document.createElement('div');
    line.className = 'cmd-line';
    line.innerHTML = html;
    outputEl.appendChild(line);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(currentInput.trim());
      currentInput = '';
      historyIndex = -1;
      drawPrompt();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      currentInput = currentInput.slice(0, -1);
      drawPrompt();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        if (historyIndex === -1) historyIndex = commandHistory.length - 1;
        else historyIndex = Math.max(0, historyIndex - 1);
        currentInput = commandHistory[historyIndex];
        drawPrompt();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex >= 0) {
        historyIndex++;
        if (historyIndex >= commandHistory.length) {
          historyIndex = -1;
          currentInput = '';
        } else {
          currentInput = commandHistory[historyIndex];
        }
        drawPrompt();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion for directories
      var parts = currentInput.split(' ');
      if (parts.length === 2) { // cd <tab>
        var partial = parts[1].toLowerCase();
        var matches = dirFiles.filter(function (f) {
          return f.toLowerCase().indexOf(partial) === 0 && files[f].type === 'DIR';
        });
        if (matches.length === 1) {
          currentInput = parts[0] + ' ' + matches[0];
          drawPrompt();
        }
      }
    } else if (e.key.length === 1) {
      e.preventDefault();
      currentInput += e.key;
      drawPrompt();
    } else if (e.key === ' ') {
      e.preventDefault();
      currentInput += ' ';
      drawPrompt();
    }
  }

  function executeCommand(cmd) {
    if (!cmd) {
      return;
    }

    commandHistory.push(cmd);

    // Show what was typed
    addOutput('<span class="cmd-prompt">' + currentDir.replace(/\\/g, '\\\\') + '&gt;</span>' + escapeHtml(cmd));

    var parts = cmd.split(/\s+/);
    var command = parts[0].toLowerCase();
    var args = parts.slice(1);

    if (commands[command]) {
      commands[command](args);
    } else if (command) {
      addOutput('<span class="cmd-red">\'<span class="cmd-white">' + escapeHtml(command) + '</span>\' is not recognized as an internal or external command,</span>');
      addOutput('<span class="cmd-red">operable program or batch file.</span>');
    }

    addOutput('');
    wrapperEl.scrollTop = wrapperEl.scrollHeight;
  }

  // --- Command implementations ---

  function helpCmd(args) {
    addOutput('<span class="cmd-white">Available commands:</span>');
    var cmdList = Object.keys(commands).sort();
    // Format in columns
    var col = 0;
    var line = '  ';
    cmdList.forEach(function (c, i) {
      line += c;
      var padding = 16 - c.length;
      for (var p = 0; p < padding; p++) line += ' ';
      col++;
      if (col >= 3) {
        addOutput(line);
        line = '  ';
        col = 0;
      }
    });
    if (col > 0) addOutput(line);
    addOutput('');
    addOutput('For more information on a specific command, type HELP command-name');
  }

  function dirCmd(args) {
    addOutput(' Volume in drive C has no label.');
    addOutput(' Volume Serial Number is A1B2-C3D4');
    addOutput('');
    addOutput(' Directory of ' + currentDir.replace(/\\/g, '\\\\'));
    addOutput('');

    var dirList = dirFiles.slice();
    addOutput(' '.repeat(10) + '&lt;DIR&gt;'.repeat(1) + ' '.repeat(11) + '.' + ' '.repeat(4) + getDateStr() + '  .');
    addOutput(' '.repeat(10) + '&lt;DIR&gt;'.repeat(1) + ' '.repeat(11) + '..' + ' '.repeat(3) + getDateStr() + '  ..');

    dirList.forEach(function (f) {
      var info = files[f] || {};
      if (info.type === 'DIR') {
        // Directory
        addOutput(' '.repeat(10) + '&lt;DIR&gt;'.repeat(1) + ' '.repeat(10) + info.date + '  ' + f);
      } else {
        // File
        var sizeStr = (info.size || '0').padStart(10);
        addOutput(sizeStr + '  '.repeat(1) + info.date + '  ' + f);
      }
    });

    var fileCount = dirList.filter(function (f) { return files[f] && files[f].type === 'FILE'; }).length;
    var dirCount = dirList.filter(function (f) { return files[f] && files[f].type === 'DIR'; }).length + 2; // . and ..

    addOutput('&nbsp;'.repeat(15) + 'File(s)'.repeat(1) + '&nbsp;'.repeat(2) + fileCount + ' &nbsp; bytes');
    addOutput('&nbsp;'.repeat(15) + 'Dir(s)'.repeat(1) + '&nbsp;'.repeat(3) + dirCount + ' &nbsp; free');
  }

  function aboutCmd(args) {
    addOutput('');
    addOutput('<span class="cmd-white">samuelphan.com — Windows XP Desktop</span>');
    addOutput('');
    addOutput('  A nostalgic re-creation of the Windows XP desktop experience,');
    addOutput('  built with HTML, CSS, and vanilla JavaScript.');
    addOutput('');
    addOutput('  Created by <span class="cmd-cyan">Samuel Phan</span>');
    addOutput('  Powered by XP.css &copy;');
    addOutput('');
  }

  function linksCmd(args) {
    addOutput('');
    addOutput('<span class="cmd-white">=== Links ===</span>');
    addOutput('');
    addOutput('  <span class="cmd-yellow">GitHub:</span>    <span class="cmd-cyan">https://github.com/samuelphan</span>');
    addOutput('  <span class="cmd-yellow">Discord:</span>    <span class="cmd-cyan">https://discord.gg/samuelphan</span>');
    addOutput('  <span class="cmd-yellow">Email:</span>      <span class="cmd-cyan">samuel@samuelphan.com</span>');
    addOutput('  <span class="cmd-yellow">Website:</span>    <span class="cmd-cyan">https://samuelphan.com</span>');
    addOutput('');
  }

  function clsCmd(args) {
    outputEl.innerHTML = '';
  }

  function dateCmd(args) {
    var d = new Date();
    addOutput('The current date is: <span class="cmd-yellow">' + d.toLocaleDateString() + '</span>');
    addOutput('Enter new date (mm-dd-yy): <span class="cmd-gray">(press Enter to keep current)</span>');
  }

  function timeCmd(args) {
    var d = new Date();
    var hours = d.getHours();
    var mins = d.getMinutes();
    var secs = d.getSeconds();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    var h12 = hours % 12 || 12;
    addOutput('The current time is: <span class="cmd-yellow">' +
      pad2(h12) + ':' + pad2(mins) + ':' + pad2(secs) + '.' + d.getMilliseconds() + ' ' + ampm + '</span>');
    addOutput('Enter new time: <span class="cmd-gray">(press Enter to keep current)</span>');
  }

  function echoCmd(args) {
    if (args.length === 0) {
      addOutput('<span class="cmd-white">ECHO is on.</span>');
      return;
    }
    var msg = args.join(' ');
    // Handle environment variables
    msg = msg.replace(/%USERNAME%/g, username);
    msg = msg.replace(/%COMPUTERNAME%/g, computername);
    msg = msg.replace(/%DATE%/g, new Date().toLocaleDateString());
    msg = msg.replace(/%TIME%/g, new Date().toLocaleTimeString());
    addOutput('<span class="cmd-white">' + escapeHtml(msg) + '</span>');
  }

  function verCmd(args) {
    addOutput('');
    addOutput('<span class="cmd-white">Microsoft(R) Windows XP</span>');
    addOutput('<span class="cmd-gray">Version 5.1 (Build 2600.xpsp_sp3_gdr.090206-1234 : Service Pack 3)</span>');
    addOutput('<span class="cmd-gray">samuelphan.com Desktop v1.0</span>');
    addOutput('');
  }

  function creditsCmd(args) {
    addOutput('');
    addOutput('<span class="cmd-white">=== Credits ===</span>');
    addOutput('');
    addOutput('  <span class="cmd-yellow">Samuel Phan</span> — Concept &amp; Development');
    addOutput('  <span class="cmd-yellow">XP.css</span> — UI Component Library');
    addOutput('  <span class="cmd-yellow">HTML/CSS/JS</span> — Built with vanilla web technologies');
    addOutput('');
    addOutput('  <span class="cmd-gray">Inspired by Microsoft Windows XP</span>');
    addOutput('');
    addOutput('  <span class="cmd-cyan">Thanks for visiting! 🖥️</span>');
    addOutput('');
  }

  function exitCmd(args) {
    addOutput('<span class="cmd-gray">Closing command prompt...</span>');
    // Find our window and close it
    setTimeout(function () {
      var wins = window.XPDesktop.WindowManager.getAll();
      for (var i = 0; i < wins.length; i++) {
        var el = wins[i].element;
        if (el && el.contains(wrapperEl)) {
          window.XPDesktop.WindowManager.close(wins[i].id);
          return;
        }
      }
    }, 300);
  }

  function typeCmd(args) {
    if (args.length === 0) {
      addOutput('<span class="cmd-red">The syntax of the command is incorrect.</span>');
      return;
    }
    var filename = args.join(' ').toLowerCase();
    var fileContents = {
      'about.txt': [
        '========================================',
        '         ABOUT SAMUEL PHAN              ',
        '========================================',
        '',
        'Hi! I\'m Samuel Phan.',
        '',
        'I\'m an Electrical Engineering student',
        'with a passion for web development,',
        'UI/UX design, and retro computing.',
        '',
        'This Windows XP desktop is a tribute',
        'to the golden age of operating systems.',
        '',
        '========================================'
      ],
      'links.txt': [
        '========================================',
        '              LINKS                     ',
        '========================================',
        '',
        'GitHub:  https://github.com/samuelphan',
        'Discord: https://discord.gg/samuelphan',
        'Email:   samuel@samuelphan.com',
        'Web:     https://samuelphan.com',
        '',
        '========================================'
      ],
      'hello.txt': [
        'Hello, world!',
        '',
        'Welcome to Windows XP Command Prompt.'
      ]
    };

    var content = fileContents[filename];
    if (content) {
      content.forEach(function (line) {
        addOutput('<span class="cmd-white">' + escapeHtml(line) + '</span>');
      });
    } else {
      addOutput('<span class="cmd-red">The system cannot find the file specified.</span>');
    }
  }

  function cdCmd(args) {
    if (args.length === 0) {
      addOutput('<span class="cmd-white">' + currentDir.replace(/\\/g, '\\\\') + '</span>');
      return;
    }
    var target = args.join(' ').toLowerCase();
    if (target === '..') {
      // Go up one level
      var parts = currentDir.split('\\');
      if (parts.length > 1) {
        parts.pop();
        currentDir = parts.join('\\');
      }
    } else if (target === '\\' || target === '/') {
      currentDir = 'C:';
    } else if (target.indexOf(':') !== -1) {
      addOutput('<span class="cmd-red">The system cannot find the drive specified.</span>');
    } else {
      // Check if it's a valid directory in our fake filesystem
      if (target === 'projects' || dirFiles.indexOf(target) !== -1) {
        if (target === 'projects') {
          currentDir = currentDir + '\\projects';
        } else {
          addOutput('<span class="cmd-red">The system cannot find the path specified.</span>');
        }
      } else {
        addOutput('<span class="cmd-red">The system cannot find the path specified.</span>');
      }
    }
    // Use backslashes
    currentDir = currentDir.replace(/\//g, '\\');
    // Ensure it starts with C:
    if (currentDir.indexOf('C:') !== 0) currentDir = 'C:' + currentDir;
  }

  function setCmd(args) {
    addOutput('<span class="cmd-white">' + 'USERNAME=' + username + '</span>');
    addOutput('<span class="cmd-white">' + 'COMPUTERNAME=' + computername + '</span>');
    addOutput('<span class="cmd-white">' + 'OS=Windows_NT' + '</span>');
    addOutput('<span class="cmd-white">' + 'PATH=C:\\WINDOWS\\system32;C:\\WINDOWS;C:\\WINDOWS\\System32\\Wbem' + '</span>');
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  // --- Launch ---
  function launchCommandPrompt() {
    var wrapper = buildWrapper();
    // Focus after DOM insertion
    setTimeout(function () { wrapper.focus(); }, 50);

    window.XPDesktop.WindowManager.createWindow({
      title: 'C:\\WINDOWS\\system32\\cmd.exe',
      icon: 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
        '<rect width="32" height="32" rx="4" fill="#000"/>' +
        '<text x="16" y="20" font-size="10" text-anchor="middle" fill="#c0c0c0" font-family="monospace">C:\\</text>' +
        '<rect x="8" y="22" width="16" height="2" fill="#c0c0c0"/>' +
        '</svg>'
      ),
      content: wrapper.outerHTML,
      width: 650,
      height: 400,
      x: 180,
      y: 120
    });
  }

  // Export
  window.XPDesktop = window.XPDesktop || {};
  window.XPDesktop.CommandPrompt = {
    launch: launchCommandPrompt
  };

  window.launchCommandPrompt = launchCommandPrompt;

  console.log('[XP Apps] Command Prompt loaded');
})();

---
title: "Command Line Tricks I Use Every Day"
date: 2026-05-08
tags:
  - productivity
  - terminal
  - tips
---

Command Line Tricks I Use Every Day
====================================

These are the shell shortcuts and commands that save me
the most time every single day.

Navigation
----------

```bash
# Jump to previous directory
cd -

# Go to home
cd

# Create + enter a directory in one go
mkdir -p deep/nested/path && cd $_
```

File Operations
---------------

```bash
# Find all Python files modified in the last 7 days
find . -name "*.py" -mtime -7

# Replace a string across many files (dry-run first!)
grep -rl "old_function" . | xargs sed -i 's/old_function/new_function/g'

# Count lines of code in a directory
find . -name "*.py" | xargs wc -l | tail -1
```

Git Shortcuts
-------------

```bash
# Undo the last commit (keep changes staged)
git reset --soft HEAD~1

# Amend the last commit message
git commit --amend -m "better message"

# See what changed since you branched
git diff main...HEAD

# Interactive rebase on last 3 commits
git rebase -i HEAD~3
```

Process Management
-------------------

```bash
# Kill a process by name
pkill -f "python server.py"

# Find what's listening on a port
lsof -i :3000

# Run a command immune to hangups
nohup long_running_task &
```

Shell Productivity
-------------------

- **Ctrl+R**: reverse search through command history
- **Ctrl+A**: jump to beginning of line
- **Ctrl+E**: jump to end of line
- **Ctrl+U**: clear from cursor to start of line
- **Ctrl+K**: clear from cursor to end of line
- **!!**: repeat the last command (great with sudo: `sudo !!`)

The best trick is the one that becomes muscle memory.
Pick one, use it for a week, then add another.

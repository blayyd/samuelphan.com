  function getDefaultContent(id) {
    // My Photos launches the Picture Viewer
    if (id === 'my-photos') {
      return '<div style="text-align:center;padding:40px 20px;color:#666;">' +
        '<div style="font-size:64px;margin-bottom:16px;">🖼️</div>' +
        '<h2 style="margin:0 0 8px;font-size:16px;">My Photos</h2>' +
        '<p>Browse your photo collection.</p>' +
        '<button onclick="setTimeout(window.launchPictureViewer,0)" ' +
        'style="margin-top:12px;padding:4px 16px;font-size:12px;">' +
        'Open Picture Viewer</button>' +
        '</div>';
    }

    var contents = {
      'my-notes': '<div style="text-align:center;padding:40px 20px;color:#666;">' +
        '<div style="font-size:64px;margin-bottom:16px;">📝</div>' +
        '<h2 style="margin:0 0 8px;font-size:16px;">My Notes</h2>' +
        '<p>Notes app coming soon.</p>' +
        '<p style="font-size:11px;color:#999;">Create and manage your notes here.</p>' +
        '</div>',

      'projects': '<div style="text-align:center;padding:40px 20px;color:#666;">' +
        '<div style="font-size:64px;margin-bottom:16px;">💼</div>' +
        '<h2 style="margin:0 0 8px;font-size:16px;">Projects</h2>' +
        '<p>Project portfolio coming soon.</p>' +
        '<p style="font-size:11px;color:#999;">Browse my recent work and projects.</p>' +
        '</div>',

      'about-me': '<div style="text-align:center;padding:40px 20px;color:#666;">' +
        '<div style="font-size:64px;margin-bottom:16px;">👤</div>' +
        '<h2 style="margin:0 0 8px;font-size:16px;">About Me</h2>' +
        '<p>Personal biography coming soon.</p>' +
        '<p style="font-size:11px;color:#999;">Learn more about who I am.</p>' +
        '</div>',

      'recycle-bin': '<div style="text-align:center;padding:40px 20px;color:#666;">' +
        '<div style="font-size:64px;margin-bottom:16px;">🗑️</div>' +
        '<h2 style="margin:0 0 8px;font-size:16px;">Recycle Bin</h2>' +
        '<p>Your recycle bin is empty.</p>' +
        '<p style="font-size:11px;color:#999;">Deleted items will appear here.</p>' +
        '</div>'
    };
    return contents[id] || '<div style="padding:20px;color:#666;"><p>Content coming soon.</p></div>';
  }

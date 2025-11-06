(function () {
  function sanitizeFilename(name) {
    if (!name) return 'chat-export';
    // Replace characters that are problematic in filenames on many systems
    let cleaned = String(name)
      .replace(/[\/\?%*:|"<>]/g, '-')   // remove path and forbidden chars
      .replace(/\s+/g, ' ')            // collapse whitespace
      .trim();
    if (cleaned.length === 0) cleaned = 'chat-export';
    // Limit total length
    if (cleaned.length > 120) cleaned = cleaned.slice(0, 120);
    return cleaned;
  }

  window.exportChatAsJSON = function (chat) {
    try {
      const title = (chat && chat.title) ? chat.title : 'chat-export';
      const filename = sanitizeFilename(title) + '.json';
      const blob = new Blob([JSON.stringify(chat, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export chat:', err);
      alert('Failed to export chat. See console for details.');
    }
  };
})();

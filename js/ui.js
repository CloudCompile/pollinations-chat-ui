// ui.js - UI utilities and helpers

const UI = {
  // Format timestamp to readable time
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  // Escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Format message content with markdown-like syntax
  formatMessage(content) {
    let formatted = this.escapeHtml(content);
    
    // Bold: **text** or __text__
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Inline code: `code`
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Code blocks: ```code```
    formatted = formatted.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
    
    // Checkmark lists: - [x] or - [ ]
    const lines = formatted.split('\n');
    const processedLines = lines.map(line => {
      const checkedMatch = line.match(/^- \[x\] (.+)$/i);
      const uncheckedMatch = line.match(/^- \[ \] (.+)$/);
      
      if (checkedMatch) {
        return `<div class="checklist-item checked"><div class="checkbox"></div><span>${checkedMatch[1]}</span></div>`;
      } else if (uncheckedMatch) {
        return `<div class="checklist-item"><div class="checkbox"></div><span>${uncheckedMatch[1]}</span></div>`;
      }
      return line;
    });
    
    // Wrap checklist items in a container
    formatted = processedLines.join('\n');
    if (formatted.includes('checklist-item')) {
      formatted = formatted.replace(/((?:<div class="checklist-item[^>]*>.*?<\/div>\n?)+)/g, '<div class="checklist">$1</div>');
    }
    
    return formatted;
  },

  // Create SVG icon
  createIcon(name) {
    const icons = {
      sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.5 3 3 1.5-3 1.5L12 12l-1.5-3-3-1.5 3-1.5L12 3zM5 15l.9 1.8L8 18l-2.1 1.2L5 21l-.9-1.8L2 18l2.1-1.2L5 15z"/></svg>',
      plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
      menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>',
      send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
      user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 00-16 0"/></svg>',
      moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
      sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
      trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
      settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M1 12h6m6 0h6"/></svg>',
      image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
    };
    
    return icons[name] || '';
  },

  // Show toast notification
  showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: var(--bg-primary);
      color: var(--text-primary);
      padding: 1rem 1.5rem;
      border-radius: 10px;
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      animation: fadeIn 0.3s ease-out;
      border: 1px solid var(--border-color);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'fadeIn 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Scroll to bottom of element
  scrollToBottom(element, smooth = true) {
    if (smooth) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      element.scrollTop = element.scrollHeight;
    }
  },

  // Auto-resize textarea
  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  },

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  },

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },

  // Format date
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Copy to clipboard with fallback
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (err2) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  },

  // Download text as file
  downloadAsFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Check if element is in viewport
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Animate scroll to element
  scrollToElement(element, options = {}) {
    const defaultOptions = {
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    };
    element.scrollIntoView({ ...defaultOptions, ...options });
  },

  // Get contrast color (black or white) for a given hex color
  getContrastColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  },

  // Local storage with expiry
  setWithExpiry(key, value, ttl) {
    const now = new Date();
    const item = {
      value: value,
      expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  getWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);
      const now = new Date();

      if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value;
    } catch (e) {
      return null;
    }
  },

  // Keyboard shortcut handler
  handleKeyboardShortcut(event, shortcuts) {
    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;

    for (const [shortcut, callback] of Object.entries(shortcuts)) {
      const parts = shortcut.toLowerCase().split('+');
      const requiresCtrl = parts.includes('ctrl') || parts.includes('cmd');
      const requiresShift = parts.includes('shift');
      const requiresAlt = parts.includes('alt');
      const requiredKey = parts[parts.length - 1];

      if (
        key === requiredKey &&
        ctrl === requiresCtrl &&
        shift === requiresShift &&
        alt === requiresAlt
      ) {
        event.preventDefault();
        callback(event);
        return true;
      }
    }
    return false;
  }
};

// Export for use in other modules
window.UI = UI;

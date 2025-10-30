// app.js - Main application initialization and coordination

const App = {
  // Initialize the application
  async init() {
    console.log('Initializing Pollinations Chat UI...');

    // Load theme preference
    this.loadTheme();

    // Load accent color preference
    this.loadAccentColor();

    // Initialize API module
    if (window.API) {
      // --- Force Pollinations configuration ---
      try {
        window.API.baseText = "https://text.pollinations.ai/openai/";
        window.API.baseImage = "https://image.pollinations.ai/prompt/";
        window.API.apiKey = null;
        window.API.usePollinations = true;

        // Clear any old API keys or dummy flags in localStorage
        if (window.Storage) {
          localStorage.removeItem("apiKey");
          localStorage.removeItem("useDummyAPI");
        }

        await window.API.init?.();

        console.log("✅ Pollinations API initialized:", window.API.baseText);
      } catch (err) {
        console.error("❌ Pollinations API failed to initialize:", err);
      }
    }

    // Initialize Markdown module
    if (window.Markdown) {
      window.Markdown.init();
    }

    // Initialize Speech module
    if (window.Speech) {
      window.Speech.init();
    }

    // Initialize Chat module
    if (window.Chat) {
      window.Chat.init();
    }

    // Setup global event listeners
    this.setupEventListeners();

    console.log('App initialized successfully!');
  },

  // Load theme from storage
  loadTheme() {
    const theme = window.Storage.getTheme();
    this.applyTheme(theme);
  },

  // Load accent color from storage
  loadAccentColor() {
    const accent = window.Storage.getAccentColor() || 'gradient';
    this.setAccentColor(accent, true); // Silent mode for initial load
  },

  // Set accent color
  setAccentColor(accent, silent = false) {
    document.body.setAttribute('data-accent', accent);
    window.Storage.saveAccentColor(accent);
    if (!silent) {
      window.UI.showToast(`Accent color changed to ${accent}`);
    }
  },

  // Apply theme
  applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    window.Storage.saveTheme(theme);
    this.updateThemeIcon();
  },

  // Update theme toggle icon
  updateThemeIcon() {
    const isDark = document.body.classList.contains('dark');
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      // Update the SVG icon
      themeToggle.innerHTML = isDark
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="12" cy="12" r="5"/>
             <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
           </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
           </svg>`;
    }
  },

  // Toggle theme
  toggleTheme() {
    const isDark = document.body.classList.contains('dark');
    this.applyTheme(isDark ? 'light' : 'dark');
  },

  // Setup global event listeners
  setupEventListeners() {
    // New chat button
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => {
        window.Chat.addChat();
      });
    }

    // Sidebar toggle (mobile)
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }

    // Sidebar close button
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    if (closeSidebarBtn && sidebar) {
      closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
      });
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // User profile dropdown
    const userProfileBtn = document.getElementById('userProfileBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (userProfileBtn && userDropdown) {
      userProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
        // Close attach menu if open
        const attachMenu = document.getElementById('attachMenu');
        if (attachMenu) attachMenu.classList.add('hidden');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!userDropdown.contains(e.target) && !userProfileBtn.contains(e.target)) {
          userDropdown.classList.add('hidden');
        }
      });

      // Handle accent color selection
      const accentSelectors = document.querySelectorAll('.accent-selector');
      accentSelectors.forEach(selector => {
        selector.addEventListener('click', (e) => {
          const accent = e.currentTarget.dataset.accent;
          this.setAccentColor(accent);
          userDropdown.classList.add('hidden');
        });
      });
    }

    // Attach menu toggle
    const attachBtn = document.getElementById('attachBtn');
    const attachMenu = document.getElementById('attachMenu');
    if (attachBtn && attachMenu) {
      attachBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        attachMenu.classList.toggle('hidden');
        // Close user dropdown if open
        if (userDropdown) userDropdown.classList.add('hidden');
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!attachMenu.contains(e.target) && !attachBtn.contains(e.target)) {
          attachMenu.classList.add('hidden');
        }
      });

      // Handle menu items
      document.getElementById('fileUploadBtn')?.addEventListener('click', () => {
        attachMenu.classList.add('hidden');
        window.UI.showToast('File upload feature coming soon!');
      });

      document.getElementById('imageGenBtn')?.addEventListener('click', () => {
        attachMenu.classList.add('hidden');
        window.UI.showToast('Image generation feature coming soon!');
      });

      document.getElementById('canvasBtn')?.addEventListener('click', () => {
        attachMenu.classList.add('hidden');
        window.UI.showToast('Canvas code generation coming soon!');
      });
    }

    // Model selector
    const modelSelector = document.getElementById('modelSelector');
    if (modelSelector) {
      modelSelector.addEventListener('change', (e) => {
        const selectedModel = e.target.value;
        if (window.API) {
          window.API.setModel(selectedModel);
        }
        window.UI.showToast(`Switched to ${e.target.options[e.target.selectedIndex].text}`);
      });
    }

    // Themes modal
    const themesBtn = document.getElementById('themesBtn');
    const themesModal = document.getElementById('themesModal');
    const closeThemesModal = document.getElementById('closeThemesModal');

    if (themesBtn && themesModal) {
      themesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        themesModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      });
    }

    if (closeThemesModal && themesModal) {
      closeThemesModal.addEventListener('click', () => {
        themesModal.classList.add('hidden');
        document.body.style.overflow = '';
      });

      // Close on overlay click
      themesModal.querySelector('.themes-modal-overlay')?.addEventListener('click', () => {
        themesModal.classList.add('hidden');
        document.body.style.overflow = '';
      });

      // Handle all accent color selectors in modal
      const modalAccentSelectors = themesModal.querySelectorAll('.accent-selector');
      modalAccentSelectors.forEach(selector => {
        selector.addEventListener('click', (e) => {
          const accent = e.currentTarget.dataset.accent;
          this.setAccentColor(accent);

          // Update active state
          modalAccentSelectors.forEach(s => s.classList.remove('active'));
          e.currentTarget.classList.add('active');
        });
      });
    }

    // Voice input button
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn && window.Speech) {
      voiceBtn.addEventListener('click', () => {
        window.Speech.toggleListening();
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K: Focus message input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const messageInput = document.getElementById('messageInput');
        if (messageInput) messageInput.focus();
      }

      // Cmd/Ctrl + N: New chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        window.Chat.addChat();
      }

      // Cmd/Ctrl + B: Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('collapsed');
      }

      // Cmd/Ctrl + Shift + L: Toggle theme
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        this.toggleTheme();
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        if (themesModal && !themesModal.classList.contains('hidden')) {
          themesModal.classList.add('hidden');
          document.body.style.overflow = '';
        }

        const shortcutsModal = document.getElementById('shortcutsModal');
        if (shortcutsModal && !shortcutsModal.classList.contains('hidden')) {
          shortcutsModal.classList.add('hidden');
          document.body.style.overflow = '';
        }
      }
    });

    // Keyboard shortcuts modal
    const keyboardShortcutsBtn = document.getElementById('keyboardShortcutsBtn');
    const shortcutsModal = document.getElementById('shortcutsModal');
    const closeShortcutsModal = document.getElementById('closeShortcutsModal');

    if (keyboardShortcutsBtn && shortcutsModal) {
      keyboardShortcutsBtn.addEventListener('click', () => {
        shortcutsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        if (userDropdown) userDropdown.classList.add('hidden');
      });
    }

    if (closeShortcutsModal && shortcutsModal) {
      closeShortcutsModal.addEventListener('click', () => {
        shortcutsModal.classList.add('hidden');
        document.body.style.overflow = '';
      });

      shortcutsModal.querySelector('.themes-modal-overlay')?.addEventListener('click', () => {
        shortcutsModal.classList.add('hidden');
        document.body.style.overflow = '';
      });
    }

    // Export chat button
    const exportChatBtn = document.getElementById('exportChatBtn');
    if (exportChatBtn) {
      exportChatBtn.addEventListener('click', () => {
        this.exportCurrentChat();
        if (userDropdown) userDropdown.classList.add('hidden');
      });
    }

    // Clear all chats button
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all chats? This action cannot be undone.')) {
          window.Storage.clear();
          window.location.reload();
        }
        if (userDropdown) userDropdown.classList.add('hidden');
      });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.getElementById('menuBtn');

        if (
          sidebar &&
          menuBtn &&
          !sidebar.contains(e.target) &&
          !menuBtn.contains(e.target) &&
          !sidebar.classList.contains('collapsed')
        ) {
          sidebar.classList.add('collapsed');
        }
      }
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Ensure sidebar is visible on desktop
        if (window.innerWidth > 768) {
          const sidebar = document.getElementById('sidebar');
          if (sidebar) sidebar.classList.remove('collapsed');
        }
      }, 250);
    });
  },

  // Export current chat to markdown file
  exportCurrentChat() {
    const activeChat = window.Chat.getActiveChat();
    if (!activeChat || activeChat.messages.length === 0) {
      window.UI.showToast('No messages to export');
      return;
    }

    let markdown = `# ${activeChat.title}\n\n`;
    markdown += `*Exported on ${new Date().toLocaleString()}*\n\n`;
    markdown += `---\n\n`;

    activeChat.messages.forEach(msg => {
      const role = msg.role === 'user' ? '**You**' : '**Assistant**';
      const time = window.UI.formatTime(msg.timestamp);
      markdown += `### ${role} (${time})\n\n`;
      markdown += `${msg.content}\n\n`;
      markdown += `---\n\n`;
    });

    const filename = `chat-${activeChat.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.md`;
    window.UI.downloadAsFile(markdown, filename, 'text/markdown');
    window.UI.showToast('Chat exported successfully');
  }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Export for global access
window.App = App;
